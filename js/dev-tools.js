// js/dev-tools.js

document.addEventListener('DOMContentLoaded', () => {
    const devModeToggle = document.getElementById('devModeToggle');
    const quickLogoutToggle = document.getElementById('quickLogoutToggle');

    // 1. Завантажуємо поточні стани з LocalStorage
    devModeToggle.checked = localStorage.getItem('devMode') === 'true';
    quickLogoutToggle.checked = localStorage.getItem('showQuickLogout') === 'true';

    // 2. Слухаємо зміни для режиму розробника
    devModeToggle.addEventListener('change', (e) => {
        localStorage.setItem('devMode', e.target.checked);
        console.log("Dev Mode:", e.target.checked);
    });

    // 3. Слухаємо зміни для швидкого виходу
    quickLogoutToggle.addEventListener('change', (e) => {
        localStorage.setItem('showQuickLogout', e.target.checked);
    });
});

// Функція повного очищення (для тестів реєстрації)
window.clearAllCache = () => {
    if (confirm("Це видалить всі дані авторизації та налаштування. Продовжити?")) {
        localStorage.clear();
        alert("Дані видалено. Сторінка буде перезавантажена.");
        window.location.href = 'index.html';
    }
};