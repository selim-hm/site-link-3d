/* ملف CSS لتنسيق الموقع */
const carousel = document.getElementById("carousel");
const cards = carousel.querySelectorAll(".card");
let currentCardIndex = 0;
const totalCards = cards.length;
let rotationInterval = null;
let isPopupOpen = false;

// ضبط المسافة والزوايا بناءً على حجم الشاشة
function getResponsiveSettings() {
  const width = window.innerWidth;

  if (width <= 400) return { rotationStep: 45, radius: 160 };
  if (width <= 600) return { rotationStep: 50, radius: 200 };
  if (width <= 768) return { rotationStep: 60, radius: 260 };
  return { rotationStep: 72, radius: 350 };
}

// وضع الكروت في الدائرة
function setCardPositions() {
  const { rotationStep, radius } = getResponsiveSettings();
  cards.forEach((card, i) => {
    const rotateY = i * rotationStep;
    const angleRad = (rotateY * Math.PI) / 180;
    const x = Math.sin(angleRad) * radius;
    const z = Math.cos(angleRad) * radius;
    card.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg)`;
  });
  rotateCarousel(); // حساب الزاوية الحالية
  updateCardSize();
}

// تكبير الكرت المحدد
function updateCardSize() {
  cards.forEach((card, i) => {
    if (i === currentCardIndex) {
      card.style.transform += " scale(1.2)";
      card.style.zIndex = "1";
    } else {
      card.style.transform = card.style.transform.replace(" scale(1.2)", "");
      card.style.zIndex = "0";
    }
  });
}

// تدوير الكاروسيل حول المحور Y
function rotateCarousel() {
  const { rotationStep } = getResponsiveSettings();
  const rotateDeg = -rotationStep * currentCardIndex;
  carousel.style.transform = `rotateY(${rotateDeg}deg)`;
}

// بدء الحركة التلقائية
function startRotation() {
  if (rotationInterval || isPopupOpen) return;
  rotationInterval = setInterval(() => {
    currentCardIndex = (currentCardIndex + 1) % totalCards;
    setCardPositions();
  }, 1400);
}

// إيقاف الحركة التلقائية
function stopRotation() {
  if (rotationInterval) {
    clearInterval(rotationInterval);
    rotationInterval = null;
  }
}

carousel.addEventListener("mouseover", () => {
  if (!isPopupOpen) stopRotation();
});

carousel.addEventListener("mouseout", () => {
  if (!isPopupOpen) startRotation();
});

carousel.addEventListener("touchstart", () => {
  if (!isPopupOpen) stopRotation();
});

carousel.addEventListener("touchend", () => {
  if (!isPopupOpen) startRotation();
});

// فتح النافذة المنبثقة المرتبطة بالكرت
function showPopup(cardId) {
  const popup = document.getElementById(`popup-${cardId}`);
  if (popup) {
    popup.classList.add("show");
    isPopupOpen = true;
    stopRotation();
  }
}

// إغلاق جميع النوافذ المنبثقة
function closePopup() {
  document.querySelectorAll(".popup").forEach((popup) => {
    popup.classList.remove("show");
  });
  isPopupOpen = false;
  startRotation();
}

// ربط حدث النقر على كل كرت لفتح الـ popup الخاص به
cards.forEach((card) => {
  card.addEventListener("click", () => {
    const cardId = card.dataset.id;
    showPopup(cardId);
  });
});

// تهيئة الكروت وبدء الحركة التلقائية
setCardPositions();
startRotation();

// إعادة ضبط مواقع الكروت عند تغيير حجم النافذة
window.addEventListener("resize", () => {
  setCardPositions();
});

document.getElementById("contact-form").addEventListener("submit", function (e) {
  e.preventDefault(); // منع التحميل التلقائي

  const form = e.target;
  const formData = new FormData(form);

  fetch(form.action, {
    method: "POST",
    body: formData,
  })
    .then(response => {
      if (response.ok) {
        document.getElementById("form-message").style.display = "block";
        form.reset();
      } else {
        alert("Failed to send message.");
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("Something went wrong.");
    });
});
