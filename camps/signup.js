(() => {
  const form = document.getElementById("camp-signup-form");
  const stages = [...document.querySelectorAll(".stage")];
  const steps = [...document.querySelectorAll(".step")];
  const backBtn = document.getElementById("back-btn");
  const nextBtn = document.getElementById("next-btn");
  const submitBtn = document.getElementById("submit-btn");
  const stageTitle = document.getElementById("stage-3-title");

  const campNameLine = document.getElementById("camp-name-line");
  const paymentStatusEl = document.getElementById("paymentStatus");
  const paymentProofInput = document.getElementById("paymentProof");
  const paymentProofName = document.getElementById("paymentProofName");

  let current = 1;
  let selectedCamp = "";
  let selectedCampId = "";

  function setPaymentStatus(msg) {
    if (paymentStatusEl) paymentStatusEl.textContent = msg || "";
  }

  function getQuery() {
    const qs = new URLSearchParams(window.location.search);
    return {
      camp: (qs.get("camp") || "").trim(),
      campId: (qs.get("campId") || "").trim(),
    };
  }

  function waitForFirebase(timeout = 7000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        if (window.firebaseAuth) return resolve(true);
        if (Date.now() - start > timeout) return resolve(false);
        setTimeout(tick, 80);
      };
      tick();
    });
  }

  async function getUserOrRedirect() {
    const ready = await waitForFirebase();
    if (!ready || !window.firebaseAuth) {
      window.location.href = "../login/login.html";
      return null;
    }

    const user =
      window.firebaseAuth.auth?.currentUser ||
      (window.firebaseAuth.waitForSignIn ? await window.firebaseAuth.waitForSignIn(2500) : null);

    if (!user) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `../login/login.html?next=${next}`;
      return null;
    }
    return user;
  }

  function buildPayload(fd) {
    const proofFile = fd.get("paymentProof");

    return {
      campName: selectedCamp || "General Camp Registration",
      payment: {
        method: "wire_transfer",
        status: "instructions_provided",
        campId: selectedCampId || "",
        proof: {
          fileName: proofFile && proofFile.name ? proofFile.name : "",
          transferDate: fd.get("transferDate") || "",
          transferReference: fd.get("transferReference") || "",
        },
      },
      personal: {
        firstName: fd.get("firstName") || "",
        lastName: fd.get("lastName") || "",
        nickname: fd.get("nickname") || "",
        birthdate: fd.get("birthdate") || "",
        address: fd.get("address") || "",
        countryOfBirth: fd.get("countryOfBirth") || ""
      },
      athlete: {
        currentTeam: fd.get("currentTeam") || "",
        position: fd.get("position") || "",
        currentGrade: fd.get("currentGrade") || "",
        currentSchool: fd.get("currentSchool") || ""
      },
      guardians: {
        guardian1: {
          name: fd.get("guardian1Name") || "",
          email: fd.get("guardian1Email") || "",
          cell: fd.get("guardian1Cell") || "",
          relationship: fd.get("guardian1Relationship") || ""
        },
        guardian2: {
          name: fd.get("guardian2Name") || "",
          email: fd.get("guardian2Email") || "",
          cell: fd.get("guardian2Cell") || "",
          relationship: fd.get("guardian2Relationship") || ""
        }
      }
    };
  }

  function getStage(n) {
    return stages.find((s) => Number(s.dataset.stage) === n);
  }

  function validateStage(n) {
    const stage = getStage(n);
    if (!stage) return true;
    const required = [...stage.querySelectorAll("[required]")];
    for (const el of required) {
      if (!el.checkValidity()) {
        el.reportValidity();
        el.focus();
        return false;
      }
    }
    return true;
  }

  function paint() {
    stages.forEach((s) => s.classList.toggle("is-active", Number(s.dataset.stage) === current));

    steps.forEach((step) => {
      const n = Number(step.dataset.step);
      step.classList.toggle("is-active", n === current);
      step.classList.toggle("is-done", n < current);
    });

    backBtn.disabled = current === 1;
    nextBtn.hidden = current === 3;
    submitBtn.hidden = current !== 3;
  }

  backBtn.addEventListener("click", () => {
    if (current > 1) current -= 1;
    paint();
  });

  nextBtn.addEventListener("click", async () => {
    if (!validateStage(current)) return;
    if (current < 3) current += 1;
    paint();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStage(current)) return;

    const user = await getUserOrRedirect();
    if (!user) return;

    try {
      submitBtn.disabled = true;
      setPaymentStatus("Saving registration...");

      const fd = new FormData(form);
      const payload = buildPayload(fd);
      await window.firebaseAuth.saveCampSignup(payload);

      window.location.href = "../account/account.html?payment=wire-transfer";
    } catch (err) {
      console.error(err);
      setPaymentStatus(err?.message || "Failed to save registration.");
      submitBtn.disabled = false;
    }
  });

  if (paymentProofInput && paymentProofName) {
    paymentProofInput.addEventListener("change", () => {
      const f = paymentProofInput.files && paymentProofInput.files[0];
      paymentProofName.textContent = f ? `Selected: ${f.name}` : "";
    });
  }

  (async function init() {
    const q = getQuery();
    selectedCamp = q.camp || "General Camp Registration";
    selectedCampId = q.campId || "";

    if (stageTitle) stageTitle.textContent = `Wire Transfer Payment (${selectedCamp})`;
    if (campNameLine) campNameLine.textContent = `Camp: ${selectedCamp}`;

    const stageParam = new URLSearchParams(window.location.search).get("stage");
    if (stageParam === "3") current = 3;

    await getUserOrRedirect();
    paint();
  })();
})();