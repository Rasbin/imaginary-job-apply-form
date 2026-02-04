document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("application-form");
  const resume = document.getElementById("resume");
  const resumeInfo = document.getElementById("resume-info");
  const addButton = document.getElementById("add-button");
  const addText = document.getElementById("add-text");
  const skillsList = document.getElementById("skills-list");
  const submitBtn = document.getElementById("submit-btn");
  const cover = document.getElementById("cover");
  const coverCount = document.getElementById("cover-count");

  let resumeValid = false;

  // Utility: show error messages
  function showError(input, message) {
    const err = document.getElementById("err-" + input.id);
    if (err) err.textContent = message || "";
    if (message) input.classList.add("invalid");
    else input.classList.remove("invalid");
  }

  // Update submit button enabled state
  function updateFormState() {
    const requiredIds = ["fullName", "email", "phone", "position", "consent"];
    let ok = true;
    requiredIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.required && !el.value) ok = false;
    });
    if (!resumeValid) ok = false;
    if (submitBtn) submitBtn.disabled = !ok;
  }

  // Resume validation
  resume.addEventListener("change", (e) => {
    const file = resume.files[0];
    resumeValid = false;
    if (!file) {
      resumeInfo.textContent = "";
      showError(resume, "");
      updateFormState();
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowed.includes(file.type)) {
      showError(resume, "Please upload a PDF or Word document.");
      resume.value = "";
      resumeInfo.textContent = "";
      updateFormState();
      return;
    }
    if (file.size > maxSize) {
      showError(resume, "File is too large (max 5MB).");
      resume.value = "";
      resumeInfo.textContent = "";
      updateFormState();
      return;
    }

    resumeValid = true;
    showError(resume, "");
    resumeInfo.textContent = `${file.name} — ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    updateFormState();
  });

  // Add skill - simple sanitize and append
  addButton.addEventListener("click", () => {
    const text = (addText.value || "").trim();
    if (!text) return;
    const id = "skill-" + text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    // avoid duplicates
    if (document.getElementById(id)) {
      // briefly flash the existing one
      const existing = document.getElementById(id);
      if (existing) {
        const lbl = existing.closest("label");
        lbl && lbl.classList.add("added");
        setTimeout(() => lbl && lbl.classList.remove("added"), 220);
      }
      addText.value = "";
      return;
    }

    const label = document.createElement("label");
    label.classList.add("user-skill", "added");
    label.innerHTML = `<input type="checkbox" id="${id}" name="skills" value="${text}" checked> ${text} <button type="button" class="remove-skill" data-id="${id}" aria-label="Remove ${text}">✕</button>`;
    skillsList.appendChild(label);

    // update selection visuals
    const checkbox = label.querySelector('input[type="checkbox"]');
    if (checkbox) {
      label.classList.toggle("selected", checkbox.checked);
      checkbox.addEventListener("change", () => {
        label.classList.toggle("selected", checkbox.checked);
      });
    }

    // remove animation class after a short delay
    setTimeout(() => label.classList.remove("added"), 250);
    addText.value = "";
  });

  // Press Enter in skill input to add
  addText.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addButton.click();
    }
  });

  // Event delegation for removing skill
  skillsList.addEventListener("click", (e) => {
    if (e.target && e.target.matches(".remove-skill")) {
      e.stopPropagation();
      const btn = e.target;
      const lbl = btn.closest("label");
      if (lbl) lbl.parentElement.removeChild(lbl);
    }
  });

  // Initialize skill labels: toggle 'selected' class when checkbox state changes
  (function initSkills() {
    const boxes = skillsList.querySelectorAll('input[type="checkbox"]');
    boxes.forEach((chk) => {
      const lbl = chk.closest("label");
      if (!lbl) return;
      lbl.classList.toggle("selected", chk.checked);
      chk.addEventListener("change", () => {
        lbl.classList.toggle("selected", chk.checked);
      });

      // allow keyboard toggle visual: pressing Enter/Space when label focused toggles checkbox
      lbl.setAttribute("tabindex", "0");
      lbl.addEventListener("keydown", (ev) => {
        if (ev.key === " " || ev.key === "Enter") {
          ev.preventDefault();
          chk.click();
        }
      });
    });
  })();

  // Basic field validations on blur
  ["fullName", "email", "phone", "position", "consent"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("blur", () => {
      if (el.required && !el.value) showError(el, "This field is required");
      else showError(el, "");
      updateFormState();
    });
    el.addEventListener("input", updateFormState);
  });

  // Phone simple pattern check
  const phone = document.getElementById("phone");
  phone &&
    phone.addEventListener("blur", () => {
      const val = phone.value.trim();
      if (val && !/^\+?[0-9\-\s()]{7,25}$/.test(val))
        showError(phone, "Enter a valid phone number");
      else showError(phone, "");
      updateFormState();
    });

  // Cover letter count
  if (cover && coverCount) {
    cover.addEventListener("input", () => {
      const len = cover.value.length;
      coverCount.textContent = `${len} / ${cover.getAttribute("maxlength") || 1000}`;
    });
  }

  // Form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // re-check
    updateFormState();
    if (submitBtn && submitBtn.disabled) return;

    // show spinner on the button
    if (submitBtn) {
      submitBtn.classList.add("loading");
      submitBtn.disabled = true;
    }

    // simulate server submission
    setTimeout(() => {
      if (submitBtn) {
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
      }
      // success actions
      const msg = document.getElementById("form-message");
      if (msg) {
        msg.style.color = "#064e3b";
        msg.textContent =
          "Thanks! Your application has been received. We will be in touch.";
      }
      form.reset();
      resumeInfo.textContent = "";
      resumeValid = false;
      updateFormState();

      // Show success modal
      showModal();
      // Show a brief success toast as micro-interaction
      showToast("Application submitted — we will be in touch.");
    }, 900);
  });

  // Modal handling & accessibility (focus trap)
  const modal = document.getElementById("success-modal");
  const modalClose = document.getElementById("modal-close");
  let lastFocused = null;

  function showModal() {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
    document.body.classList.add("no-scroll");
    // focus first focusable element in modal
    const focusable = modal.querySelectorAll(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length) focusable[0].focus();
    document.addEventListener("keydown", trapFocus);
  }

  function hideModal() {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("open");
    document.body.classList.remove("no-scroll");
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    document.removeEventListener("keydown", trapFocus);
  }

  // trap tab focus inside modal
  function trapFocus(e) {
    if (e.key !== "Tab") return;
    const focusable = Array.from(
      modal.querySelectorAll(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // Close handlers: button, overlay click, ESC key
  modalClose && modalClose.addEventListener("click", hideModal);
  modal &&
    modal.addEventListener("click", (e) => {
      if (
        e.target &&
        (e.target.classList.contains("modal-overlay") ||
          e.target.dataset.close === "true")
      )
        hideModal();
    });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("open"))
      hideModal();
  });

  // Toast handling (show & auto-dismiss)
  const toast = document.getElementById("toast");
  const toastClose = toast && toast.querySelector(".toast-close");
  let toastTimer = null;

  function showToast(message, duration = 3500) {
    if (!toast) return;
    const msgEl = toast.querySelector(".toast-message");
    if (msgEl) msgEl.textContent = message;
    toast.setAttribute("aria-hidden", "false");
    toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, duration);
  }

  function hideToast() {
    if (!toast) return;
    toast.setAttribute("aria-hidden", "true");
    toast.classList.remove("show");
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
  }

  toastClose && toastClose.addEventListener("click", hideToast);

  // initialize
  updateFormState();
});
