import { supabase } from './supabase.js';

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
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
  };

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
          await signUp(email, password);
          setStatus('Cadastro realizado! Verifique seu e-mail para confirmar.', false);
        } else {
          await signIn(email, password);
          modal.style.display = 'none';
        }
      } catch (err) {
        let msg = err.message;
        if (msg === 'Invalid login credentials') msg = 'E-mail ou senha incorretos.';
        if (msg === 'Email not confirmed') msg = 'Por favor, confirme seu e-mail antes de entrar.';
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
    if (onAuthChange) onAuthChange(user, event);
  });
}
