(() => {
  "use strict";

  const config = window.CONFIG;
  const pages = [...document.querySelectorAll(".page")];
  const indicators = [...document.querySelectorAll("[data-page]")];
  const pageNumber = document.getElementById("pageNumber");
  const previousPage = document.getElementById("previousPage");
  const nextPage = document.getElementById("nextPage");
  let currentPage = 0;
  let currentPhoto = 0;
  let lastPhotoTrigger = null;

  if (!config || pages.length !== 5 || indicators.length !== pages.length) {
    throw new Error("The surprise page configuration is incomplete.");
  }
  document.title = config.openingTitle;

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Required page element is missing: ${id}`);
    element.textContent = value;
    return element;
  };

  const goToPage = (index) => {
    if (!Number.isInteger(index) || index < 0 || index >= pages.length) return;
    currentPage = index;
    pages.forEach((page, pageIndex) => {
      const active = pageIndex === index;
      page.hidden = !active;
      page.classList.toggle("is-active", active);
    });
    indicators.forEach((indicator, pageIndex) => {
      if (pageIndex === index) indicator.setAttribute("aria-current", "page");
      else indicator.removeAttribute("aria-current");
    });
    pageNumber.textContent = `${String(index + 1).padStart(2, "0")} / ${String(pages.length).padStart(2, "0")}`;
    previousPage.disabled = index === 0;
    nextPage.disabled = index === pages.length - 1;
  };

  setText("openingTitle", config.openingTitle);
  setText("openingMessage", config.openingMessage);
  setText("openButton", config.openingButton);
  setText("letterOriginal", config.letter.original);
  setText("nickname", config.secret.nickname);
  setText("secretButton", config.secret.button);
  setText("secretOriginal", config.secret.original);
  setText("secretAddition", config.secret.addition);
  setText("songTitle", config.song.title);
  setText("songArtist", config.song.artist);

  const additions = document.getElementById("letterAdditions");
  config.letter.additions.forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    additions.append(paragraph);
  });

  const gallery = document.getElementById("gallery");
  const lightbox = document.getElementById("photoLightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");

  const showPhoto = (index) => {
    currentPhoto = (index + config.photos.length) % config.photos.length;
    const photo = config.photos[currentPhoto];
    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.caption;
    lightboxCaption.textContent = photo.caption;
  };

  config.photos.forEach((photo, index) => {
    const card = document.createElement("article");
    card.className = "photo-card";
    const trigger = document.createElement("button");
    trigger.className = "photo-trigger";
    trigger.type = "button";
    trigger.setAttribute("aria-label", `View photo ${index + 1}`);
    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.caption;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      const fallback = document.createElement("span");
      fallback.className = "photo-fallback";
      fallback.textContent = `${config.settings.photoFallback}${photo.src}`;
      image.replaceWith(fallback);
      trigger.disabled = true;
      trigger.setAttribute("aria-label", `Photo ${index + 1} is missing`);
    }, { once: true });
    trigger.append(image);
    trigger.addEventListener("click", () => {
      lastPhotoTrigger = trigger;
      showPhoto(index);
      lightbox.showModal();
      document.getElementById("closeLightbox").focus();
    });
    const caption = document.createElement("p");
    caption.className = "photo-caption";
    caption.textContent = photo.caption;
    card.append(trigger, caption);
    gallery.append(card);
  });

  const audio = document.getElementById("songAudio");
  const playButton = document.getElementById("playButton");
  const audioFallback = document.getElementById("audioFallback");
  const record = document.getElementById("record");
  const showAudioFallback = () => {
    audioFallback.textContent = `${config.settings.audioFallback}${config.song.src}`;
    audioFallback.hidden = false;
  };
  audio.src = config.song.src;
  playButton.textContent = config.settings.playLabel;
  audio.addEventListener("error", showAudioFallback);
  audio.addEventListener("play", () => {
    record.classList.add("is-playing");
    playButton.textContent = config.settings.pauseLabel;
    playButton.setAttribute("aria-pressed", "true");
  });
  audio.addEventListener("pause", () => {
    record.classList.remove("is-playing");
    playButton.textContent = config.settings.playLabel;
    playButton.setAttribute("aria-pressed", "false");
  });
  playButton.addEventListener("click", async () => {
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
    } catch {
      showAudioFallback();
    }
  });

  document.getElementById("secretButton").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const message = document.getElementById("secretMessage");
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    message.hidden = isOpen;
  });

  document.getElementById("openButton").addEventListener("click", () => goToPage(1));
  document.getElementById("galleryButton").addEventListener("click", () => goToPage(2));
  document.getElementById("musicButton").addEventListener("click", () => goToPage(3));
  document.getElementById("secretPageButton").addEventListener("click", () => goToPage(4));
  previousPage.addEventListener("click", () => goToPage(currentPage - 1));
  nextPage.addEventListener("click", () => goToPage(currentPage + 1));
  indicators.forEach((indicator) => {
    indicator.setAttribute("aria-label", `Go to ${config.settings.pageLabels[Number(indicator.dataset.page)]}`);
    indicator.addEventListener("click", () => goToPage(Number(indicator.dataset.page)));
  });

  document.getElementById("closeLightbox").addEventListener("click", () => lightbox.close());
  document.getElementById("previousPhoto").addEventListener("click", () => showPhoto(currentPhoto - 1));
  document.getElementById("nextPhoto").addEventListener("click", () => showPhoto(currentPhoto + 1));
  lightbox.addEventListener("close", () => lastPhotoTrigger?.focus());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" && !lightbox.open) goToPage(currentPage + 1);
    if (event.key === "ArrowLeft" && !lightbox.open) goToPage(currentPage - 1);
    if (lightbox.open && event.key === "ArrowRight") showPhoto(currentPhoto + 1);
    if (lightbox.open && event.key === "ArrowLeft") showPhoto(currentPhoto - 1);
  });

  goToPage(0);
})();
