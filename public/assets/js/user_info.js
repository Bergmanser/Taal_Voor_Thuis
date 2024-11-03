import { onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase_config.js";

let selectedAvatar = null;
let currentUserEmail = '';

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserEmail = user.email;
      document.getElementById('usernameDisplay').textContent = `Welcome, ${user.email}`;
      await loadUserInfo(user.email);
    }
  });
});

async function loadUserInfo(email) {
  const docRef = doc(db, "studentdb", email);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById('name').value = data.name || '';
    document.getElementById('realNameSwitch').checked = data.real_name_enabled || false;
    selectAvatar(data.avatar || 1); // Default to avatar 1

    // Check if the real name should be shown
    updateHeaderDisplay(data.real_name_enabled, data.name);
  } else {
    console.log("No user data found");
  }
}

function selectAvatar(avatarId) {
  const avatars = document.querySelectorAll('.avatar');
  avatars.forEach((avatar, index) => {
    if (index + 1 === avatarId) {
      avatar.classList.add('selected');
    } else {
      avatar.classList.remove('selected');
    }
  });
  selectedAvatar = avatarId;
}

function toggleAvatars() {
  const avatarSection = document.getElementById('avatarSelection');
  const arrow = document.getElementById('arrow');
  avatarSection.classList.toggle('hidden');
  arrow.textContent = avatarSection.classList.contains('hidden') ? '▼' : '▲';
}

async function resetPassword() {
  if (currentUserEmail) {
    try {
      await sendPasswordResetEmail(auth, currentUserEmail);
      alert('Password reset email sent!');
    } catch (error) {
      console.error('Error sending password reset email: ', error);
    }
  }
}

async function saveUserInfo() {
  const name = document.getElementById('name').value;
  const realNameEnabled = document.getElementById('realNameSwitch').checked;

  try {
    const userRef = doc(db, "studentdb", currentUserEmail);
    await setDoc(userRef, {
      name,
      real_name_enabled: realNameEnabled,
      avatar: selectedAvatar
    }, { merge: true });

    // Update the header based on real_name_enabled
    updateHeaderDisplay(realNameEnabled, name);

    alert('User information saved!');
    location.reload();
  } catch (error) {
    console.error('Error saving user info: ', error);
  }
}

function updateHeaderDisplay(realNameEnabled, name) {
  const header = document.getElementById('usernameDisplay');
  if (realNameEnabled && name) {
    header.textContent = `Welcome, ${name}`;
  } else {
    header.textContent = `Welcome, ${currentUserEmail}`;
  }
}
