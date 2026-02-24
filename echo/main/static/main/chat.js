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
    
    // (rename removed)
    
    // Delete Modal
    const deleteGoalOverlay = document.getElementById("deleteGoalOverlay");
    const closeDeleteGoal = document.getElementById("closeDeleteGoal");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    let currentDeleteGoal = null;
    
    // --- Right Sidebar: Roadmap ---
    const completeBtns = document.querySelectorAll(".complete-btn");
    const progressFill = document.querySelector(".progress-fill");
    const progressPercent = document.getElementById("progressPercent");


    // change here: create hidden UI elements for 'creating roadmap' and for errors
    // Creating roadmap card (hidden initially)
    const creatingRoadmapOverlay = document.createElement("div");
    creatingRoadmapOverlay.className = "modal-overlay hidden";
    creatingRoadmapOverlay.id = "creatingRoadmapOverlay";
    creatingRoadmapOverlay.innerHTML = `
        <div class="modal small-modal">
            <div class="modal-header">
                <h3>Creating Roadmap</h3>
            </div>
            <div class="modal-content" style="display:flex;align-items:center;gap:12px;">
                <div class="spinner" aria-hidden="true" style="width:28px;height:28px;border-radius:50%;border:3px solid rgba(0,0,0,0.08);border-top-color:currentColor;animation:spin 1s linear infinite;"></div>
                <div>
                    <p style="margin:0">We're mapping your execution path. This may take a few seconds...</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(creatingRoadmapOverlay);

    // Error card (hidden initially)
    const errorOverlay = document.createElement("div");
    errorOverlay.className = "modal-overlay hidden";
    errorOverlay.id = "errorOverlay";
    errorOverlay.innerHTML = `
        <div class="modal delete-modal">
            <div class="modal-header">
                <h3>Error</h3>
                <button class="close-modal" id="closeErrorOverlay">&times;</button>
            </div>
            <div class="modal-content">
                <p id="errorOverlayMessage">An unknown error occurred.</p>
            </div>
        </div>
    `;
    document.body.appendChild(errorOverlay);
    const errorOverlayMessage = document.getElementById("errorOverlayMessage");
    const closeErrorOverlay = document.getElementById("closeErrorOverlay");
    closeErrorOverlay.addEventListener("click", () => {
        errorOverlay.classList.remove("active");
        errorOverlay.classList.add("hidden");
    });

    // change here: inject minimal keyframes for spinner used in creating overlay
    const _style = document.createElement('style');
    _style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(_style);
    
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
    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text) return;

        const activeGoal = goalsList.querySelector(".goal-item.active");
        console.log(activeGoal);
        const goalId = activeGoal ? activeGoal.id : null;
        const userId = chatWindow.dataset.userId;

        if (!userId || !goalId) {
            showError("Please select a goal first.");
            return;
        }

        addMessage(text, "user");
        messageInput.value = "";
        messageInput.style.height = "auto";
        sendBtn.disabled = true;

        showTypingIndicator();

        try {
            const res = await fetch("/sendmessage/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    goal_id: parseInt(goalId, 10),
                    user_message: text
                })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                const aiContent = data.ai_content || "";
                addMessage(aiContent, "ai");
            } else if (res.status === 404) {    
                showError(data.error || "Goal not found.");
            } else if (res.status === 400) {
                const errMsg = data.errors ? Object.values(data.errors).flat().join(" ") : (data.error || "Invalid request.");
                showError(errMsg);
            } else if (res.status === 500) {
                showError(data.error || "Something went wrong. Please try again later.");
                console.error("Chat error:", data.error);
            } else {
                showError(data.error || "Failed to send message. Please try again.");
                console.error("Chat error:", data.error);
            }
        } catch (err) {
            console.error("Chat error:", err);
            showError("Network error. Please check your connection and try again.");
        } finally {
            removeTypingIndicator();
            sendBtn.disabled = messageInput.value.trim().length === 0;
        }
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
        // change here: show creating roadmap card and wait for 5s before finishing
        (async () => {
            const title = document.getElementById("newGoalTitle").value.trim();
            const description = document.getElementById("newGoalDescription").value.trim();
            // change here: read deadline value from modal
            const deadline = document.getElementById("newGoalDeadline").value;
            const formatted_deadline = (deadline === "") ? null : deadline;
            if (!title || !description) return;

            try {
                // show creating overlay
                creatingRoadmapOverlay.classList.remove("hidden");
                creatingRoadmapOverlay.classList.add("active");

                // simulate server-side roadmap generation delay (5s)
                await create_goal(
                    title,
                    description,
                    formatted_deadline
                )

                newGoalOverlay.classList.remove("active");
                newGoalOverlay.classList.add("hidden");

                document.getElementById("newGoalTitle").value = "";
                document.getElementById("newGoalDescription").value = "";
            } catch (err) {
                // change here: show error overlay with message
                showError(err && err.message ? err.message : "Failed to create goal.");
            } finally {
                // always hide creating overlay
                creatingRoadmapOverlay.classList.remove("active");
                creatingRoadmapOverlay.classList.add("hidden");
            }
        })();
    });

    function addGoalToList(title, deadline, goal_id) {
        // guard against invalid IDs coming from the server
        if (!goal_id || goal_id === "undefined") {
            console.warn("addGoalToList blocked: invalid goal_id", goal_id);
            return;
        }

        const goalItem = document.createElement("div");
        goalItem.classList.add("goal-item");
        goalItem.setAttribute("id", String(goal_id));
        goalItem.innerHTML = `
            <div class="goal-info">
                <svg class="goal-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                <div style="display:flex;flex-direction:column;min-width:0">
                    <span class="goal-title">${title}</span>
                    <!-- change here: display deadline if provided -->
                    <span class="goal-deadline" style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${''}</span>
                </div>
            </div>
            <div class="goal-actions">
                <button class="action-btn delete-btn" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
        
        // change here: populate deadline display
        if (deadline) {
            const dl = goalItem.querySelector('.goal-deadline');
            if (dl) dl.textContent = `Due ${deadline}`;
        }

        // Selection is handled via delegated listener on `goalsList`.
        // (No per-item click listener here to avoid duplicates.)
        
        setupGoalActions(goalItem);

        // insert new goals above existing goal items so they're hoisted to the top
        const firstExistingGoal = goalsList.querySelector('.goal-item');
        // try to find the footer in the left sidebar (may be outside goalsList depending on template)
        const sidebarFooter = document.querySelector('#sidebarLeft .sidebar-footer') || goalsList.querySelector('.sidebar-footer');

        if (firstExistingGoal) {
            goalsList.insertBefore(goalItem, firstExistingGoal);
        } else if (sidebarFooter && sidebarFooter.parentNode) {
            // Insert before footer in its parent so the new goal doesn't end up after the user profile
            sidebarFooter.parentNode.insertBefore(goalItem, sidebarFooter);
        } else {
            goalsList.appendChild(goalItem);
        }

        // make the newly created goal active and hoist it to the top
        try {
            setTimeout(() => {
            selectGoal(goalItem);
        }, 0);
        } catch (err) {
            console.warn('Could not auto-select new goal:', err);
        }
    }

   function selectGoal(goalItem) {
    if (!goalItem) return;

    const goal_id = goalItem.id;

    // 🔒 HARD GUARD
    if (!goal_id || goal_id === "undefined") {
        console.warn("selectGoal blocked: invalid goal_id", goal_id);
        return;
    }

    goalsList.querySelectorAll(".goal-item").forEach(item => {
        item.classList.remove("active");
    });

    goalItem.classList.add("active");

    const titleEl = goalItem.querySelector(".goal-title");
    if (titleEl) {
        document.querySelector(".goal-context").textContent =
            `Working on: ${titleEl.textContent}`;
    }

    get_roadmap(goal_id);
}


    function setupGoalActions(goalItem) {
        if (goalItem.dataset.actionsAttached) return;
        goalItem.dataset.actionsAttached = "true";

        const deleteBtn = goalItem.querySelector(".delete-btn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                currentDeleteGoal = goalItem;
                deleteGoalOverlay.classList.remove("hidden");
                deleteGoalOverlay.classList.add("active");
            });
        }
    }

    document.querySelectorAll(".goal-item").forEach(setupGoalActions);

    // Auto-select the top (first) goal on load and fetch its roadmap
    (function autoSelectTopGoal() {
        if (!goalsList) return;
        const firstGoal = goalsList.querySelector('.goal-item');
        const roadmapEmpty = document.getElementById('roadmapEmpty');

        if (firstGoal) {
            // ensure empty-state is hidden when we have a goal
            if (roadmapEmpty) roadmapEmpty.classList.add('hidden');
            try {
                selectGoal(firstGoal);
            } catch (err) {
                console.warn('Could not auto-select top goal:', err);
            }
        } else {
            // show empty roadmap state when there are no goals
            if (roadmapEmpty) roadmapEmpty.classList.remove('hidden');
        }
    })();

    // here: delegate click events on the goals list so existing items also trigger selection
    if (goalsList) {
        goalsList.addEventListener('click', (e) => {
            const clickedItem = e.target.closest('.goal-item');
            if (!clickedItem) return;
            // ignore clicks on action buttons (rename/delete)
            if (e.target.closest('.action-btn')) return;
            selectGoal(clickedItem);
        });
    }


    // --- Delete Goal ---
    if (closeDeleteGoal) {
        closeDeleteGoal.addEventListener("click", () => {
            deleteGoalOverlay.classList.remove("active");
            deleteGoalOverlay.classList.add("hidden");
        });
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener("click", () => {
            deleteGoalOverlay.classList.remove("active");
            deleteGoalOverlay.classList.add("hidden");
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", () => {
            (async () => {
                if (!currentDeleteGoal) return;

                const goalId = currentDeleteGoal.id;
                confirmDeleteBtn.disabled = true;
                const prevText = confirmDeleteBtn.textContent;
                confirmDeleteBtn.textContent = 'Deleting...';

                try {
                    const res = await fetch(`/deletegoal/${goalId}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRFToken': getCookie('csrftoken') || ''
                        },
                        credentials: 'same-origin'
                    });

                    if (res.status === 200) {
                        // remove from DOM
                        currentDeleteGoal.remove();
                        deleteGoalOverlay.classList.remove("active");
                        deleteGoalOverlay.classList.add("hidden");
                        currentDeleteGoal = null;
                    } else if (res.status === 403) {
                        showError('Permission denied. Please refresh the page and try again.');
                    } else if (res.status === 404) {
                        const data = await res.json().catch(() => ({}));
                        showError(data.error || 'Goal not found');
                    } else if (res.status === 405) {
                        showError('Invalid request method for deleting goal');
                    } else {
                        const data = await res.json().catch(() => ({}));
                        showError(data.error || 'Failed to delete goal');
                    }
                } catch (err) {
                    console.error('Error deleting goal', err);
                    showError('Network error deleting goal');
                } finally {
                    confirmDeleteBtn.disabled = false;
                    confirmDeleteBtn.textContent = prevText;
                }
            })();
        });
    }

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
    async function completePhaseByButton(btn) {
        const phaseCard = btn.closest(".phase-card");
        const phaseTitle = phaseCard.querySelector("h4").textContent;
        const phaseId = btn.dataset.phaseId;

        // optimistically mark current as completed
        phaseCard.classList.remove("active");
        phaseCard.classList.add("completed");
        btn.textContent = "Completed";
        btn.classList.add("disabled");
        btn.disabled = true;
        const statusEl = phaseCard.querySelector(".phase-status");
        if (statusEl) statusEl.textContent = "✓";

        try {
            if (phaseId) {
                const res = await fetch(`/updatestatus/${phaseId}`);
                if (res.status === 200) {
                    const data = await res.json();
                    const nextId = data.next_phase;
                    if (nextId) {
                        const nextPhaseEl = document.getElementById(String(nextId));
                        if (nextPhaseEl) {
                            nextPhaseEl.classList.remove("locked");
                            nextPhaseEl.classList.add("active");
                            const ns = nextPhaseEl.querySelector('.phase-status');
                            if (ns) ns.textContent = '●';

                            // replace/enable the button
                            let nextBtn = nextPhaseEl.querySelector('.phase-btn');
                            if (nextBtn) {
                                const newBtn = document.createElement('button');
                                newBtn.className = 'phase-btn complete-btn';
                                newBtn.dataset.phaseId = String(nextId);
                                newBtn.textContent = 'Mark Complete';
                                nextBtn.replaceWith(newBtn);
                                nextBtn = newBtn;
                            } else {
                                const newBtn = document.createElement('button');
                                newBtn.className = 'phase-btn complete-btn';
                                newBtn.dataset.phaseId = String(nextId);
                                newBtn.textContent = 'Mark Complete';
                                nextPhaseEl.appendChild(newBtn);
                                nextBtn = newBtn;
                            }

                            // attach handler to newly enabled button
                            nextBtn.addEventListener('click', () => completePhaseByButton(nextBtn));
                        }
                    }
                } else if (res.status === 204) {
                    // no next phase
                } else {
                    const errData = await res.json().catch(() => ({}));
                    console.error('Failed to update phase status', errData);
                    showError(errData.error || 'Failed to update phase status');
                }
            }
        } catch (err) {
            console.error('Error updating phase status', err);
            showError('Could not update phase status');
        }

        updateProgress();

        setTimeout(() => {
            addMilestoneMessage(phaseTitle);
        }, 500);

        if (window.innerWidth <= 1024) {
            closeRightSidebar();
        }
    }

    completeBtns.forEach(btn => {
        btn.addEventListener('click', function() { completePhaseByButton(this); });
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
                    <p>You finished "${phaseTitle}".</p>
                </div>
            </div>
        `;
        
        chatWindow.appendChild(messageDiv);
        scrollToBottom();
    }

    // change here: helper to show errors in the created error overlay
    function showError(message, autoHide = true) {
        const msgEl = document.getElementById("errorOverlayMessage");
        if (msgEl) msgEl.textContent = message;
        errorOverlay.classList.remove("hidden");
        errorOverlay.classList.add("active");

        if (autoHide) {
            setTimeout(() => {
                errorOverlay.classList.remove("active");
                errorOverlay.classList.add("hidden");
            }, 5000);
        }
    }

    

    async function create_goal(title, description, deadline){
        try{
            const res = await fetch("/create_goal/", {
                method:"POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    title:title,
                    description:description,
                    deadline:deadline
                })
            })
        
            const data = await res.json();
            
            if(res.status === 405){
                errorOverlay.classList.remove("hidden");
                errorOverlay.classList.add("active");
                console.error("goal creation error", data.error);
            }
            else if(res.status === 400 && data.errors){
                const error = Object.values(data.errors)[0];
                errorOverlay.classList.remove("active");
                errorOverlay.classList.add("hidden");
                errorOverlayMessage.textContent = error[0];
                console.error("goal creation error", error[0]);
            }
            else if(res.status === 400 && data.error){
                showError(data.error);
                console.error("goal creation error", data.error);
            }
            else if(res.status === 500){
                errorOverlay.classList.remove("active");
                errorOverlay.classList.add("hidden");
                console.error("goal creation error", data.error);
            }
            else if(res.status === 200){
                const newGoalId = data.goal_id ?? data.id ?? data.goal?.id;
                if (!newGoalId) {
                    console.error("goal creation error: missing goal_id in response", data);
                    showError("Something went wrong creating your goal. Please try again.");
                    return;
                }
                addGoalToList(title, deadline, newGoalId);
            }
        }

        catch(error){
            errorOverlay.classList.remove("active");
            errorOverlay.classList.add("hidden");
            console.error("goal creation error", error);
        }
        
    }

    async function get_roadmap(goal_id){
        try{
            const res = await fetch(`/getroadmap/${goal_id}`);
            const data = await res.json();
            if(res.status === 405){
                showError("Something went wrong try again later or contact us");
                console.error(data.error)
            }

            else if(res.status === 404){
                showError(data.error);
            }

            else if(res.status === 500){
                showError("Something went wrong try again later or contact us");
                console.error(data.error);
            }

            else if(res.status === 200){
                // Render fetched phases into the right-sidebar `phasesList`.
                try {
                    const phasesListEl = document.getElementById('phasesList');
                    if (!phasesListEl) return;

                    // data is a mapping of id -> { phase_id, phase_order, phase_title, phase_status }
                    const phasesArray = Object.values(data || {});
                    // order by phase_order
                    phasesArray.sort((a, b) => (a.phase_order || 0) - (b.phase_order || 0));

                    // Clear existing mock/example phases
                    phasesListEl.innerHTML = '';

                    phasesArray.forEach(phase => {
                        const phaseId = phase.phase_id;
                        const order = phase.phase_order;
                        const title = phase.phase_title || '';
                        const status = (phase.phase_status || '').toLowerCase();

                        const card = document.createElement('div');
                        card.className = 'phase-card';
                        // Set HTML id to the phase_id as requested
                        card.id = String(phaseId);

                        let statusSymbol = '';
                        let btnHtml = '';

                        if (status === 'completed') {
                            card.classList.add('completed');
                            statusSymbol = '✓';
                            btnHtml = '<button class="phase-btn disabled" disabled>Completed</button>';
                        } else if (status === 'in_progress' || status === 'inprogress') {
                            card.classList.add('active');
                            statusSymbol = '●';
                            btnHtml = `<button class="phase-btn complete-btn" data-phase-id="${phaseId}">Mark Complete</button>`;
                        } else {
                            // pending / unknown -> locked
                            card.classList.add('locked');
                            statusSymbol = '🔒';
                            btnHtml = '<button class="phase-btn disabled" disabled>Locked</button>';
                        }

                        card.innerHTML = `
                            <div class="phase-header">
                                <span class="phase-status">${statusSymbol}</span>
                                <h4>${title}</h4>
                            </div>
                            <p></p>
                            ${btnHtml}
                        `;

                        phasesListEl.appendChild(card);
                    });

                    // Rebind complete button handlers for newly created buttons
                    const newCompleteBtns = phasesListEl.querySelectorAll('.complete-btn');
                    newCompleteBtns.forEach(btn => {
                        btn.addEventListener('click', function() { completePhaseByButton(this); });
                    });

                    // Update progress display after rendering
                    updateProgress();
                }
                catch (err) {
                    console.error('Error rendering roadmap phases', err);
                }
            }
        }

        catch(error){
            showError("Something went wrong try again later or contact us");
            console.error(error)
        }
    }
});
