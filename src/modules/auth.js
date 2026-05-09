import { supabase } from './supabase.js';

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  
  // Supabase security feature: if user is returned but identities is empty,
  // it means the email is already taken.
  if (data?.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error('user_already_exists');
  }
  
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// UI Helper to show/hide login modal
export function setupAuthUI(onAuthChange) {
  const loginBtn = document.getElementById('btnLogin');
  const modal = document.getElementById('authModal');
  const closeBtn = document.getElementById('closeModal');
  const authForm = document.getElementById('authForm');
  const logoutBtn = document.getElementById('btnLogout');
  const userEmail = document.getElementById('userEmail');
  const authError = document.getElementById('authError');
  const btnForgotPwd = document.getElementById('btnForgotPwd');
  
  const updatePwdModal = document.getElementById('updatePwdModal');
  const updatePwdForm = document.getElementById('updatePwdForm');
  const updatePwdError = document.getElementById('updatePwdError');

  const setStatus = (msg, isError = true) => {
    if (!authError) return;
    authError.textContent = msg;
    authError.style.color = isError ? 'var(--red)' : 'var(--green)';
    authError.style.display = msg ? 'block' : 'none';
  };

  const setBusy = (isBusy) => {
    const btns = authForm.querySelectorAll('button');
    btns.forEach(b => b.disabled = isBusy);
    if (isBusy) btns[0].innerHTML = '<span class="spinner"></span>';
    else {
      btns[0].textContent = 'Entrar';
      btns[1].textContent = 'Cadastrar';
    }
  };

  if (loginBtn) loginBtn.onclick = () => {
    modal.style.display = 'flex';
    setStatus('');
  };
  
  if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
  
  // Close on outside click
  window.onclick = (event) => {
    if (event.target === modal) modal.style.display = 'none';
    if (event.target === updatePwdModal) updatePwdModal.style.display = 'none';
  };

  if (btnForgotPwd) {
    btnForgotPwd.onclick = async () => {
      const email = authForm.email.value;
      if (!email) {
        setStatus("Digite seu e-mail acima antes de recuperar a senha.");
        return;
      }
      try {
        setBusy(true);
        await resetPassword(email);
        setStatus("E-mail de recuperação enviado! Verifique sua caixa de entrada.", false);
      } catch (err) {
        setStatus(err.message);
      } finally {
        setBusy(false);
      }
    };
  }

  if (updatePwdForm) {
    updatePwdForm.onsubmit = async (e) => {
      e.preventDefault();
      const newPwd = e.target.newPassword.value;
      const btn = updatePwdForm.querySelector('button');
      
      try {
        btn.disabled = true;
        btn.textContent = "Salvando...";
        await updatePassword(newPwd);
        updatePwdModal.style.display = 'none';
        alert("Senha atualizada com sucesso!");
      } catch (err) {
        if (updatePwdError) {
          updatePwdError.textContent = err.message;
          updatePwdError.style.display = 'block';
          updatePwdError.style.color = 'var(--red)';
        }
      } finally {
        btn.disabled = false;
        btn.textContent = "Salvar Nova Senha";
      }
    };
  }

  if (authForm) {
    authForm.onsubmit = async (e) => {
      e.preventDefault();
      setStatus('');
      setBusy(true);

      const email = e.target.email.value;
      const password = e.target.password.value;
      const mode = e.submitter ? e.submitter.dataset.mode : 'login';

      try {
        if (mode === 'signup') {
          const res = await signUp(email, password);
          if (res?.session) {
             // Confirm email is disabled in Supabase, logged in immediately
             setStatus('Cadastro realizado com sucesso!', false);
             setTimeout(() => modal.style.display = 'none', 1500);
          } else {
             setStatus('Cadastro realizado! Verifique seu e-mail para confirmar.', false);
          }
        } else {
          await signIn(email, password);
          modal.style.display = 'none';
        }
      } catch (err) {
        let msg = err.message;
        if (msg === 'Invalid login credentials') msg = 'E-mail ou senha incorretos.';
        if (msg === 'Email not confirmed') msg = 'Por favor, confirme seu e-mail antes de entrar.';
        if (msg === 'user_already_exists' || msg === 'User already registered') msg = 'Este e-mail já está cadastrado.';
        if (msg.includes('rate limit')) msg = 'Muitas tentativas. Aguarde um momento e tente novamente.';
        if (msg.includes('Password should be')) msg = 'A senha deve ter pelo menos 6 caracteres.';
        setStatus(msg);
      } finally {
        setBusy(false);
      }
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      try {
        await signOut();
      } catch (err) {
        console.error("Erro ao sair:", err);
      }
    };
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user || null;
    if (user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (userEmail) userEmail.textContent = user.email;
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (userEmail) userEmail.textContent = '';
    }
    
    if (event === 'PASSWORD_RECOVERY') {
      if (modal) modal.style.display = 'none';
      if (updatePwdModal) updatePwdModal.style.display = 'flex';
    }

    if (onAuthChange) onAuthChange(user, event);
  });
}
