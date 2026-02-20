const COLOR_RED = "#9249ffff";
const COLOR_WHITE = "#f7fafe";
const DURATION_MULTIPLIER = 30;

const button = document.querySelector(".btn-like");
const mainSection = document.querySelector(".main-section");

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
      mainSection.classList.add("hide")
    }, 3000);
});

// btn-no moving

const NoBtn = document.querySelector('.btn-no');
// const cursorX = 

NoBtn.addEventListener('mouseover', () => {
  NoBtn.style.position = 'absolute';
  NoBtn.style.left = `${Math.ceil(Math.random() * 90)}%`;
  NoBtn.style.top = `${Math.ceil(Math.random() * 90)}%`;
})
