document.addEventListener("DOMContentLoaded", () => {
    // --- Chat Logic ---
    const chatForm = document.getElementById("chatForm");
    const messageInput = document.getElementById("messageInput");
    const chatWindow = document.getElementById("chatWindow");
    const sendBtn = document.getElementById("sendBtn");
    
    // --- Left Sidebar: Goal Management ---
    const newGoalBtn = document.getElementById("newGoalBtn");
    const goalsList = document.getElementById("goalsList");
    const newGoalOverlay = document.getElementById("newGoalOverlay");
    const closeNewGoal = document.getElementById("closeNewGoal");
    const createGoalBtn = document.getElementById("createGoalBtn");
    
    // Rename Modal
    const renameGoalOverlay = document.getElementById("renameGoalOverlay");
    const closeRenameGoal = document.getElementById("closeRenameGoal");
    const renameGoalTitle = document.getElementById("renameGoalTitle");
    const saveRenameBtn = document.getElementById("saveRenameBtn");
    let currentRenameGoal = null;
    
    // Delete Modal
    const deleteGoalOverlay = document.getElementById("deleteGoalOverlay");
    const closeDeleteGoal = document.getElementById("closeDeleteGoal");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    let currentDeleteGoal = null;
    
    // --- Right Sidebar: Roadmap ---
    const generatePlanBtn = document.getElementById("generatePlanBtn");
    const generatePlanBtnEmpty = document.getElementById("generatePlanBtnEmpty");
    const completeBtns = document.querySelectorAll(".complete-btn");
    const progressFill = document.querySelector(".progress-fill");
    const progressPercent = document.getElementById("progressPercent");
    
    // --- Reflections Drawer ---
    const reflectionsBtn = document.getElementById("reflectionsBtn");
    const reflectionsDrawer = document.getElementById("reflectionsDrawer");
    const reflectionsOverlay = document.getElementById("reflectionsOverlay");
    const closeReflections = document.getElementById("closeReflections");
    
    // --- Mobile Sidebar Toggles ---
    const toggleLeftSidebar = document.getElementById("toggleLeftSidebar");
    const toggleRightSidebar = document.getElementById("toggleRightSidebar");
    const sidebarLeft = document.getElementById("sidebarLeft");
    const sidebarRight = document.getElementById("sidebarRight");
    const mobileOverlayLeft = document.getElementById("mobileOverlayLeft");
    const mobileOverlayRight = document.getElementById("mobileOverlayRight");

    // --- Auto-resize Textarea ---
    messageInput.addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
        
        if (this.value.trim().length > 0) {
            sendBtn.disabled = false;
        } else {
            sendBtn.disabled = true;
        }
    });

    // --- Handle Enter Key ---
    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled) {
                chatForm.dispatchEvent(new Event("submit"));
            }
        }
    });

    // --- Send Message (System 1) ---
    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text) return;

        addMessage(text, "user");
        messageInput.value = "";
        messageInput.style.height = "auto";
        sendBtn.disabled = true;

        showTypingIndicator();
        
        setTimeout(() => {
            removeTypingIndicator();
            const mockResponse = "I hear you. Remember why we started this. Do you want to check the roadmap?";
            addMessage(mockResponse, "ai");
        }, 1500);
    });

    function addMessage(text, type) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", `${type}-message`);
        
        const contentDiv = document.createElement("div");
        contentDiv.classList.add("message-content");
        
        const p = document.createElement("p");
        p.textContent = text;
        
        contentDiv.appendChild(p);
        messageDiv.appendChild(contentDiv);
        chatWindow.appendChild(messageDiv);
        
        scrollToBottom();
    }

    // --- Typing Indicator ---
    let typingIndicator = null;

    function showTypingIndicator() {
        typingIndicator = document.createElement("div");
        typingIndicator.classList.add("message", "ai-message", "typing-indicator");
        typingIndicator.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        chatWindow.appendChild(typingIndicator);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        if (typingIndicator) {
            typingIndicator.remove();
            typingIndicator = null;
        }
    }

    function scrollToBottom() {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // --- Mobile Sidebar Toggles ---
    function openLeftSidebar() {
        sidebarLeft.classList.add("active");
        mobileOverlayLeft.classList.remove("hidden");
        mobileOverlayLeft.classList.add("active");
    }

    function closeLeftSidebar() {
        sidebarLeft.classList.remove("active");
        mobileOverlayLeft.classList.remove("active");
        mobileOverlayLeft.classList.add("hidden");
    }

    function openRightSidebar() {
        sidebarRight.classList.add("active");
        mobileOverlayRight.classList.remove("hidden");
        mobileOverlayRight.classList.add("active");
    }

    function closeRightSidebar() {
        sidebarRight.classList.remove("active");
        mobileOverlayRight.classList.remove("active");
        mobileOverlayRight.classList.add("hidden");
    }

    toggleLeftSidebar.addEventListener("click", openLeftSidebar);
    toggleRightSidebar.addEventListener("click", openRightSidebar);
    mobileOverlayLeft.addEventListener("click", closeLeftSidebar);
    mobileOverlayRight.addEventListener("click", closeRightSidebar);

    // --- Goal Management: New Goal ---
    newGoalBtn.addEventListener("click", () => {
        newGoalOverlay.classList.remove("hidden");
        newGoalOverlay.classList.add("active");
    });

    closeNewGoal.addEventListener("click", () => {
        newGoalOverlay.classList.remove("active");
        newGoalOverlay.classList.add("hidden");
    });

    createGoalBtn.addEventListener("click", () => {
        const title = document.getElementById("newGoalTitle").value.trim();
        const description = document.getElementById("newGoalDescription").value.trim();
        
        if (title) {
            addGoalToList(title);
            newGoalOverlay.classList.remove("active");
            newGoalOverlay.classList.add("hidden");
            document.getElementById("newGoalTitle").value = "";
            document.getElementById("newGoalDescription").value = "";
        }
    });

    function addGoalToList(title) {
        const goalItem = document.createElement("div");
        goalItem.classList.add("goal-item");
        goalItem.innerHTML = `
            <div class="goal-info">
                <svg class="goal-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                <span class="goal-title">${title}</span>
            </div>
            <div class="goal-actions">
                <button class="action-btn rename-btn" title="Rename">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="action-btn delete-btn" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
        
        goalItem.addEventListener("click", (e) => {
            if (!e.target.closest(".action-btn")) {
                selectGoal(goalItem);
            }
        });
        
        setupGoalActions(goalItem);
        
        goalsList.appendChild(goalItem);
    }

    function selectGoal(goalItem) {
        goalsList.querySelectorAll(".goal-item").forEach(item => {
            item.classList.remove("active");
        });
        goalItem.classList.add("active");
        
        const goalTitle = goalItem.querySelector(".goal-title").textContent;
        document.querySelector(".goal-context").textContent = `Working on: ${goalTitle}`;
        
        // Close mobile sidebar after selection
        if (window.innerWidth <= 1024) {
            closeLeftSidebar();
        }
    }

    function setupGoalActions(goalItem) {
        const renameBtn = goalItem.querySelector(".rename-btn");
        const deleteBtn = goalItem.querySelector(".delete-btn");
        
        renameBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            currentRenameGoal = goalItem;
            const currentTitle = goalItem.querySelector(".goal-title").textContent;
            renameGoalTitle.value = currentTitle;
            renameGoalOverlay.classList.remove("hidden");
            renameGoalOverlay.classList.add("active");
        });
        
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            currentDeleteGoal = goalItem;
            deleteGoalOverlay.classList.remove("hidden");
            deleteGoalOverlay.classList.add("active");
        });
    }

    document.querySelectorAll(".goal-item").forEach(setupGoalActions);

    // --- Rename Goal ---
    closeRenameGoal.addEventListener("click", () => {
        renameGoalOverlay.classList.remove("active");
        renameGoalOverlay.classList.add("hidden");
    });

    saveRenameBtn.addEventListener("click", () => {
        if (currentRenameGoal) {
            const newTitle = renameGoalTitle.value.trim();
            if (newTitle) {
                currentRenameGoal.querySelector(".goal-title").textContent = newTitle;
                if (currentRenameGoal.classList.contains("active")) {
                    document.querySelector(".goal-context").textContent = `Working on: ${newTitle}`;
                }
            }
            renameGoalOverlay.classList.remove("active");
            renameGoalOverlay.classList.add("hidden");
            currentRenameGoal = null;
        }
    });

    // --- Delete Goal ---
    closeDeleteGoal.addEventListener("click", () => {
        deleteGoalOverlay.classList.remove("active");
        deleteGoalOverlay.classList.add("hidden");
    });

    cancelDeleteBtn.addEventListener("click", () => {
        deleteGoalOverlay.classList.remove("active");
        deleteGoalOverlay.classList.add("hidden");
    });

    confirmDeleteBtn.addEventListener("click", () => {
        if (currentDeleteGoal) {
            currentDeleteGoal.remove();
            deleteGoalOverlay.classList.remove("active");
            deleteGoalOverlay.classList.add("hidden");
            currentDeleteGoal = null;
        }
    });

    // --- Reflections Drawer ---
    function openReflections() {
        reflectionsDrawer.classList.add("active");
        reflectionsOverlay.classList.add("active");
    }

    function closeReflectionsFunc() {
        reflectionsDrawer.classList.remove("active");
        reflectionsOverlay.classList.remove("active");
    }

    reflectionsBtn.addEventListener("click", openReflections);
    closeReflections.addEventListener("click", closeReflectionsFunc);
    reflectionsOverlay.addEventListener("click", closeReflectionsFunc);

    // --- Roadmap Completion Logic (System 2 → System 1) ---
    completeBtns.forEach(btn => {
        btn.addEventListener("click", function() {
            const phaseCard = this.closest(".phase-card");
            const phaseTitle = phaseCard.querySelector("h4").textContent;
            
            phaseCard.classList.remove("active");
            phaseCard.classList.add("completed");
            this.textContent = "Completed";
            this.classList.add("disabled");
            this.disabled = true;
            phaseCard.querySelector(".phase-status").textContent = "✓";
            
            const nextPhase = phaseCard.nextElementSibling;
            if (nextPhase && nextPhase.classList.contains("locked")) {
                nextPhase.classList.remove("locked");
                nextPhase.classList.add("active");
                nextPhase.querySelector(".phase-status").textContent = "●";
                nextPhase.querySelector(".phase-btn").classList.remove("disabled");
                nextPhase.querySelector(".phase-btn").disabled = false;
                nextPhase.querySelector(".phase-btn").classList.add("complete-btn");
            }
            
            updateProgress();

            setTimeout(() => {
                addMilestoneMessage(phaseTitle);
            }, 500);
            
            // Close mobile sidebar after completion
            if (window.innerWidth <= 1024) {
                closeRightSidebar();
            }
        });
    });

    function updateProgress() {
        const total = 4;
        const completed = document.querySelectorAll(".phase-card.completed").length;
        const percent = Math.round((completed / total) * 100);
        
        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
    }

    function addMilestoneMessage(phaseTitle) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", "milestone-message");
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="milestone-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div class="milestone-text">
                    <h4>Phase Completed</h4>
                    <p>You finished "${phaseTitle}". This is the consistency you said mattered. Silence has a cost, but so does stopping.</p>
                </div>
            </div>
        `;
        
        chatWindow.appendChild(messageDiv);
        scrollToBottom();
    }

    generatePlanBtn.addEventListener("click", () => {
        alert("Generating new roadmap based on your goal...");
    });

    generatePlanBtnEmpty.addEventListener("click", () => {
        document.getElementById("roadmapEmpty").classList.add("hidden");
        document.getElementById("phasesList").classList.remove("hidden");
    });
});