function openModal() {
  let modal = document.getElementById('signupModal');
  modal.classList.add('show');
  modal.style.display = 'block'; // Set display to block immediately
  modal.style.opacity = 1; // Ensure it's visible
}

function closeModal() {
  let modal = document.getElementById('signupModal');
  modal.classList.add('hide');

  function handleAnimationEnd() {
    modal.classList.remove('show', 'hide');
    modal.style.display = 'none';
    modal.removeEventListener('animationend', handleAnimationEnd);
  }

  modal.addEventListener('animationend', handleAnimationEnd);
}

function openLoginModal() {
  let modal = document.getElementById('loginModal');
  modal.classList.add('show');
  modal.style.display = 'block'; // Set display to block immediately
  modal.style.opacity = 1; // Ensure it's visible
}

function closeLoginModal() {
  let modal = document.getElementById('loginModal');
  modal.classList.add('hide');

  function handleAnimationEnd() {
    modal.classList.remove('show', 'hide');
    modal.style.display = 'none';
    modal.removeEventListener('animationend', handleAnimationEnd);
  }

  modal.addEventListener('animationend', handleAnimationEnd);
}


// Optional: Close modal if the user clicks anywhere outside of it
window.onclick = function(event) {
  let signupModal = document.getElementById('signupModal');
  let loginModal = document.getElementById('loginModal');
  
  if (event.target == signupModal) {
    closeModal();
  } else if (event.target == loginModal) {
    closeLoginModal();
  }
}
