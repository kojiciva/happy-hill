const CONFIG = {
  // TODO: Confirm with client.
  phone: "+381 6X XXX XXXX",
  // TODO: Confirm with client.
  email: "email@za-potvrdu.rs",
  // TODO: Confirm with client.
  instagramUrl: "",
  // TODO: Confirm with client.
  mapEmbedUrl: "",
  // TODO: Confirm exact address with client.
  address: "Bocke, Sremska Kamenica, Novi Sad",
  // TODO: Confirm with client.
  capacityMin: "XX",
  capacityMax: "YY",
  // TODO: Confirm legal name with client.
  legalName: "Pravni naziv nije potvrđen",
};

const header = document.querySelector("#site-header");
const hero = document.querySelector(".hero");
const stickyCta = document.querySelector("#sticky-cta");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCaption = document.querySelector("#lightbox-caption");
const lightboxClose = document.querySelector("#lightbox-close");
let lastFocusedElement = null;

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

function applyConfig() {
  setText("[data-config-phone]", CONFIG.phone);
  setText("[data-config-email]", CONFIG.email);
  setText("[data-config-address]", CONFIG.address);
  setText("[data-config-legal-name]", CONFIG.legalName);
  setText("[data-config-capacity]", `oko ${CONFIG.capacityMin}–${CONFIG.capacityMax} gostiju`);

  document.querySelectorAll("[data-config-phone-link]").forEach((link) => {
    link.href = `tel:${CONFIG.phone.replace(/[^+\d]/g, "")}`;
  });
  document.querySelectorAll("[data-config-email-link]").forEach((link) => {
    link.href = `mailto:${CONFIG.email}`;
  });

  const instagramLink = document.querySelector("[data-config-instagram-link]");
  if (instagramLink && CONFIG.instagramUrl) {
    instagramLink.href = CONFIG.instagramUrl;
    instagramLink.target = "_blank";
    instagramLink.rel = "noreferrer";
    setText("[data-config-instagram]", "Instagram");
  }

  const mapEmbed = document.querySelector("#map-embed");
  const mapPlaceholder = document.querySelector("#map-placeholder");
  if (mapEmbed && mapPlaceholder && CONFIG.mapEmbedUrl) {
    mapEmbed.src = CONFIG.mapEmbedUrl;
    mapEmbed.hidden = false;
    mapPlaceholder.hidden = true;
  } else if (mapEmbed) {
    mapEmbed.hidden = true;
  }
}

applyConfig();

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const stickyObserver = new IntersectionObserver(
  ([entry]) => {
    const isScrolled = !entry.isIntersecting;
    header.classList.toggle("is-scrolled", isScrolled);
    stickyCta.classList.toggle("is-visible", isScrolled);
  },
  { threshold: 0.1 },
);

stickyObserver.observe(hero);

function openLightbox(button) {
  lastFocusedElement = document.activeElement;
  lightboxImage.src = button.dataset.lightboxSrc;
  lightboxImage.alt = button.dataset.lightboxAlt || "";
  lightboxCaption.textContent = button.dataset.lightboxCaption || "";
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lightboxImage.src = "";
  if (lastFocusedElement) lastFocusedElement.focus();
}

document.querySelectorAll(".gallery-item").forEach((button) => {
  button.addEventListener("click", () => openLightbox(button));
});

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
  if (event.key === "Tab" && lightbox.classList.contains("is-open")) {
    event.preventDefault();
    lightboxClose.focus();
  }
});