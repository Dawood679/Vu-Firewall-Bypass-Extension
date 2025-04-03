

const fetchActiveTab = async () => chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => tabs[0]);

const displayTemporaryMessage = (element, message, duration = 2000) => {
  if (!element._originalText) element._originalText = element.textContent;
  element.textContent = message;
  element.disabled = true;

  clearTimeout(element._timeout);
  element._timeout = setTimeout(() => {
    element.textContent = element._originalText;
    element.disabled = false;
  }, duration);
};



// Core logic
const handleBypassVideo = async (button) => {
  const activeTab = await fetchActiveTab();

  if (!activeTab.url.includes("vulms.vu.edu.pk") || !activeTab.url.includes("LessonViewer.aspx")) {
    return displayTemporaryMessage(button, "Only works on Lesson page.");
  }

  displayTemporaryMessage(button, "In Progress");

  chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    world: "MAIN",
    func: () => {
      return new Promise((resolve) => {
        const activeTabId = $("#hfActiveTab").val().replace("tabHeader", "");
        const nextTab = document.querySelector(`li[data-contentid="tab${activeTabId}"]`)?.nextElementSibling;
        const nextTabId = nextTab?.dataset?.contentid?.replace?.("tab", "") || "-1";
        const isVideo = $("#hfIsVideo" + activeTabId)?.val();

        if (!isVideo || isVideo === "0") return resolve("Not a video tab");

        const randomDuration = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

        const studentId = $("#hfStudentID").val();
        const courseCode = $("#hfCourseCode").val();
        const enrollmentSemester = $("#hfEnrollmentSemester").val();
        const lessonTitle = document.getElementById("MainContent_lblLessonTitle").title.split(":")[0].replace("Lesson", "").trim();
        const duration = $("#hfIsAvailableOnYoutube" + activeTabId).val() === "True" 
          ? CurrentPlayer.getDuration() 
          : CurrentLVPlayer.duration;

        const watchedDuration = randomDuration(duration / 3, duration / 2);

        PageMethods.SaveStudentVideoLog(
          studentId, 
          courseCode, 
          enrollmentSemester, 
          lessonTitle, 
          $("#hfContentID" + activeTabId).val(),
          watchedDuration, 
          duration, 
          $("#hfVideoID" + activeTabId).val(),
          isVideo, 
          window.location.href,
          (result) => {
            UpdateTabStatus(result, activeTabId, nextTabId);
            resolve("Bypassed");
          }
        );
      });
    }
  }).then((results) => {
    const message = results[0]?.result || "Error occurred";
    displayTemporaryMessage(button, message);
  });
};

const handleAllowEvents = async (button) => {
  displayTemporaryMessage(button, "In Progress");

  chrome.scripting.executeScript({
    target: { tabId: (await fetchActiveTab()).id, allFrames: true },
    world: "MAIN",
    func: () => {
      if (typeof window.Node?.prototype?._getEventListeners !== "function") return "Not supported";

      const elements = [...document.querySelectorAll("*"), document, window];
      const blockedEvents = ["copy", "paste", "cut", "contextmenu", "keyup", "keypress", "keydown", "auxclick"];
      const controllers = [];

      elements.forEach(element => {
        if (typeof element._getEventListeners === "function") {
          const listeners = element._getEventListeners();
          for (const eventType in listeners) {
            if (blockedEvents.includes(eventType)) {
              listeners[eventType].forEach(listener => controllers.push(listener.controller));
            }
          }
        }
      });

      controllers.forEach(controller => controller.abort());
    }
  }).then((results) => {
    const allSupported = results.every(result => typeof result.result === "string");
    displayTemporaryMessage(button, allSupported ? "Not supported on this page." : "Done! You can now copy, paste.");
  });
};

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  

  document.getElementById("bypass-video").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button) handleBypassVideo(button);
  });

  document.getElementById("allow-events").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button) handleAllowEvents(button);
  });
});