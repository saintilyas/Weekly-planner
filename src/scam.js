const COLOR_RED = "#9249ffff";
const COLOR_WHITE = "#f7fafe";
const DURATION_MULTIPLIER = 30;

const button = document.querySelector(".btn-like");
const mainSection = document.querySelector(".main-section");
const successSection = document.querySelector(".success-section");

const moTimeline = new mojs.Timeline();
const moScaleCurve = mojs.easing.path("M0 100H15.5C51 54.5 14.5 7.5 100 0");

const moTween1 = new mojs.Burst({
  parent: button,
  angle: { 0: 45 },
  y: -10,
  count: 8,
  radius: 130,
  children: {
    shape: "circle",
    radius: 28,
    fill: [COLOR_RED, COLOR_WHITE],
    duration: 60 * DURATION_MULTIPLIER
  }
});

const moTween2 = new mojs.Tween({
  duration: 90 * DURATION_MULTIPLIER,
  onUpdate: (progress) => {
    const moScaleProgress = moScaleCurve(progress);
    button.style.transform = `translate(0%, 0%) scale3d(${moScaleProgress}, ${moScaleProgress}, 1)`;
  }
});

moTimeline.add(moTween1, moTween2);

button.addEventListener("click", () => {
    moTimeline.play();
    button.classList.add("liked");
    setTimeout(() => {
      mainSection.classList.add("hide");
      successSection.classList.remove("hide");
    }, 3000);
});

//-------- btn move and hide after 5 hovers ------------//

const noBtn = document.querySelector('.btn-no');
let hoverCount = 0;

noBtn.addEventListener("mouseenter", () => {
  hoverCount++;

  if (hoverCount < 5) {

    const card = document.querySelector ('.main-wrap');
    const cardRect = card.getBoundingClientRect();
    const noBtnRect = noBtn.getBoundingClientRect();

    console.log(cardRect, noBtnRect)
    const posX = Math.floor(cardRect.width - noBtnRect.width) / 2;
    const posY = Math.floor(cardRect.height - noBtnRect.height) / 2;
    console.log(posX, posY);

    const randomX = Math.random() * (posX * 2) - posX;
    const randomY = Math.random() * (posY * 2) - posY;

    console.log(randomX, randomY)
    
    noBtn.style.position = "absolute"
    noBtn.style.left = "50%";
    noBtn.style.top = "50%";
    noBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
  } else {
    noBtn.classList.add("hidden");
  }
})
