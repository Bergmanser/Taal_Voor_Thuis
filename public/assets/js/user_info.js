import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase_config.js";
import { redirectUserBasedOnRole } from './roleRedirect.js';

class ProfileManager {
  constructor() {
    this.currentUser = null;
    this.selectedAvatar = null;
    this.elements = this.initializeElements();
    this.initializeEventListeners();
    this.initializeAuthStateObserver();
    this.avatarPaths = {
      1: '../public/assets/images/background_2.png',
      2: '../public/assets/images/background_2.png',
      3: '../public/assets/images/background_2.png',
      4: '../public/assets/images/background_2.png',
      5: '../public/assets/images/background_2.png',
      6: '../public/assets/images/background_2.png',
      // Expected format:
      // 1: '../public/assets/images/avatars/avatar1.png'
    };
  }

  initializeElements() {
    return {
      username: document.getElementById('username'),
      currentAvatar: document.getElementById('currentAvatar'),
      avatarToggle: document.getElementById('avatarToggle'),
      avatarGrid: document.getElementById('avatarGrid'),
      avatarArrow: document.getElementById('avatarArrow'),
      saveBtn: document.getElementById('saveBtn'),
      saveBtnText: document.getElementById('saveBtnText')
    };
  }

  initializeEventListeners() {
    this.elements.avatarToggle.addEventListener('click', () => this.toggleAvatarGrid());
    this.elements.currentAvatar.addEventListener('click', () => this.toggleAvatarGrid());
    this.elements.saveBtn.addEventListener('click', () => this.saveAvatar());
    document.getElementById('removeAvatarBtn').addEventListener('click', () => this.removeAvatar());
    document.querySelector('.back-btn').addEventListener('click', () => {
      window.history.back();
    });
  }

  async removeAvatar() {
    try {
      const studentQuery = query(
        collection(db, "studentdb"),
        where("email", "==", this.currentUser.email)
      );

      const querySnapshot = await getDocs(studentQuery);

      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        const studentRef = doc(db, "studentdb", studentDoc.id);

        const updatedData = studentDoc.data();
        delete updatedData.studentAvatar;

        await setDoc(studentRef, updatedData);

        this.showToast('success', 'Avatar verwijderd!');
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      this.showToast('error', 'Fout bij het verwijderen van avatar');
      console.error('Error removing avatar:', error);
    }
  }

  initializeAuthStateObserver() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user;
        await this.loadUserInfo();
        redirectUserBasedOnRole([0]);
      }
    });
  }

  async loadUserInfo() {
    try {
      const studentQuery = query(
        collection(db, "studentdb"),
        where("email", "==", this.currentUser.email)
      );

      const querySnapshot = await getDocs(studentQuery);

      if (!querySnapshot.empty) {
        const studentData = querySnapshot.docs[0].data();
        this.selectedAvatar = studentData.studentAvatar;
        this.updateUserDisplay(studentData);
        this.initializeAvatarGrid(studentData.studentAvatar);
      }
    } catch (error) {
      this.showToast('error', 'Fout bij het laden van gebruikersgegevens');
      console.error('Error loading user info:', error);
    }
  }

  updateUserDisplay(userData) {
    this.elements.username.textContent = userData.username || 'Student';

    if (userData.studentAvatar) {
      this.elements.currentAvatar.innerHTML =
        `<img src="${this.avatarPaths[userData.studentAvatar]}" alt="Current avatar">`;
    } else {
      const initial = (userData.username || 'S').charAt(0).toUpperCase();
      this.elements.currentAvatar.innerHTML = initial;
    }
  }

  initializeAvatarGrid(currentAvatar) {
    this.elements.avatarGrid.innerHTML = '';

    Object.entries(this.avatarPaths).forEach(([id, path]) => {
      const option = document.createElement('div');
      option.className = `avatar-option${parseInt(id) === currentAvatar ? ' selected' : ''}`;
      option.innerHTML = `<img src="${path}" alt="Avatar ${id}">`;
      option.addEventListener('click', () => this.selectAvatar(parseInt(id)));
      this.elements.avatarGrid.appendChild(option);
    });
  }

  selectAvatar(avatarId) {
    this.selectedAvatar = avatarId;

    document.querySelectorAll('.avatar-option').forEach((option, index) => {
      option.classList.toggle('selected', index + 1 === avatarId);
    });

    // Update preview with actual image path
    this.elements.currentAvatar.innerHTML =
      `<img src="${this.avatarPaths[avatarId]}" alt="Selected avatar">`;
  }

  toggleAvatarGrid() {
    const isHidden = this.elements.avatarGrid.classList.toggle('hidden');
    this.elements.avatarArrow.classList.toggle('fa-chevron-up', !isHidden);
    this.elements.avatarArrow.classList.toggle('fa-chevron-down', isHidden);
  }

  async saveAvatar() {
    if (!this.selectedAvatar) {
      this.showToast('error', 'Selecteer eerst een avatar');
      return;
    }

    this.toggleSaveButton(true);

    try {
      // First find the user's document ID by email
      const studentQuery = query(
        collection(db, "studentdb"),
        where("email", "==", this.currentUser.email)
      );

      const querySnapshot = await getDocs(studentQuery);

      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        const studentRef = doc(db, "studentdb", studentDoc.id);

        await setDoc(studentRef, {
          ...studentDoc.data(),
          studentAvatar: this.selectedAvatar
        });

        this.showToast('success', 'Avatar opgeslagen!');
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      this.showToast('error', 'Fout bij het opslaan van de avatar');
      console.error('Error saving avatar:', error);
    } finally {
      this.toggleSaveButton(false);
    }
  }

  toggleSaveButton(loading) {
    this.elements.saveBtn.disabled = loading;
    this.elements.saveBtnText.innerHTML = loading ?
      '<i class="fas fa-spinner fa-spin"></i> Opslaan...' :
      'Wijzigingen Opslaan <i class="fas fa-check"></i>';
  }

  showToast(type, message) {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');

    icon.className = `toast-icon fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`;
    messageEl.textContent = message;

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

// Initialize the profile manager
document.addEventListener('DOMContentLoaded', () => new ProfileManager());