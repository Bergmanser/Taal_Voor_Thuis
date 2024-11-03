// File: /public/assets/js/local_storage.js

export function saveStateToLocalStorage(state) {
    try {
        localStorage.setItem('quizState', JSON.stringify(state));
        console.log('State saved to localStorage:', state);
    } catch (error) {
        console.error('Error saving state to localStorage:', error);
    }
}

export function loadStateFromLocalStorage() {
    try {
        const state = JSON.parse(localStorage.getItem('quizState'));
        console.log('State loaded from localStorage:', state);
        return state;
    } catch (error) {
        console.error('Error loading state from localStorage:', error);
        return null;
    }
}

export function clearStateFromLocalStorage() {
    try {
        localStorage.removeItem('quizState');
        console.log('State cleared from localStorage.');
    } catch (error) {
        console.error('Error clearing state from localStorage:', error);
    }
}
