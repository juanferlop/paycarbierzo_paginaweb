// Proyecto 1
const swiperThumbs1 = new Swiper(".mySwiper-proyecto1", {
  spaceBetween: 10,
  slidesPerView: 4,
  freeMode: true,
  watchSlidesProgress: true,
});
const swiperMain1 = new Swiper(".mySwiper2-proyecto1", {
  spaceBetween: 10,
  navigation: {
    nextEl: ".mySwiper2-proyecto1 .swiper-button-next",
    prevEl: ".mySwiper2-proyecto1 .swiper-button-prev",
  },
  thumbs: {
    swiper: swiperThumbs1,
  },
});

// Proyecto 2
const swiperThumbs2 = new Swiper(".mySwiper-proyecto2", {
  spaceBetween: 10,
  slidesPerView: 4,
  freeMode: true,
  watchSlidesProgress: true,
});
const swiperMain2 = new Swiper(".mySwiper2-proyecto2", {
  spaceBetween: 10,
  navigation: {
    nextEl: ".mySwiper2-proyecto2 .swiper-button-next",
    prevEl: ".mySwiper2-proyecto2 .swiper-button-prev",
  },
  thumbs: {
    swiper: swiperThumbs2,
  },
});

// Proyecto 3
const swiperThumbs3 = new Swiper(".mySwiper-proyecto3", {
  spaceBetween: 10,
  slidesPerView: 4,
  freeMode: true,
  watchSlidesProgress: true,
});
const swiperMain3 = new Swiper(".mySwiper2-proyecto3", {
  spaceBetween: 10,
  navigation: {
    nextEl: ".mySwiper2-proyecto3 .swiper-button-next",
    prevEl: ".mySwiper2-proyecto3 .swiper-button-prev",
  },
  thumbs: {
    swiper: swiperThumbs3,
  },
});
