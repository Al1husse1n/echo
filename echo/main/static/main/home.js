document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("futureProfileForm");
    const failureOverlay = document.getElementById("failureOverlay");
    const successOverlay = document.getElementById("successOverlay");
    const errorMessage = document.getElementById("error-message");
    // Select all checkboxes within the values grid
    const valueCheckboxes = document.querySelectorAll(".values-grid input[type='checkbox']");
    const counterDisplay = document.getElementById("valueCount");
    const maxValues = 5;
    

    async function submit_form(target_year, identity_description, core_values, long_term_goals, anticipated_regrets, current_limitations, preferred_tone, commitment_reason){
        try{
            const res = await fetch('/profileform/',{
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    target_year: target_year,
                    identity_description: identity_description,
                    core_values: core_values,
                    long_term_goals: long_term_goals,
                    anticipated_regrets: anticipated_regrets,
                    current_limitations: current_limitations,
                    preferred_tone: preferred_tone,
                    commitment_reason: commitment_reason 
                })
            })

            const data = await res.json();

            if(res.status === 405){
                failureOverlay.classList.add("active");
                errorMessage.textContent = "Something went wrong, please try again or contact us";
                console.error("form submission error", data.error);
                setTimeout(() => {
                    window.location.href = "/home/";
                }, 2000);

            }

            else if(res.status === 400){
                const error = Object.values(data.errors)[0];
                failureOverlay.classList.add("active");
                errorMessage.textContent = error[0];
                console.error("form submission error", data.error);
                setTimeout(() => {
                    window.location.href = "/home/";
                }, 2000);
                
            }

            else if(res.status === 500){
                failureOverlay.classList.add("active");
                errorMessage.textContent = "Something went wrong, please try again or contact us";
                console.error("form submission error", data.error);
                setTimeout(() => {
                    window.location.href = "/home/";
                }, 2000);

            }

            else if (res.ok) {
                successOverlay.classList.add("active");

                setTimeout(() => {
                    window.location.href = "/chat/";
                }, 2000);
            }

        }
        catch(error){
            failureOverlay.classList.add("active");
            errorMessage.textContent = "Something went wrong, please try again or contact us";
            console.error("form submission error", error);
            setTimeout(() => {
                window.location.href = "/home/";
            }, 2000);
        }
    }

    // 1. Handle Value Tags (Checkbox Logic)
    valueCheckboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            const checkedCount = document.querySelectorAll(".values-grid input:checked").length;
            
            // Update Counter
            counterDisplay.innerText = `(${checkedCount}/${maxValues})`;

            // Logic to disable unchecked boxes if max reached
            if (checkedCount >= maxValues) {
                valueCheckboxes.forEach(box => {
                    if (!box.checked) {
                        box.parentElement.style.opacity = "0.5";
                        box.parentElement.style.pointerEvents = "none";
                        box.parentElement.style.cursor = "not-allowed";
                    }
                });
            } else {
                // Re-enable all
                valueCheckboxes.forEach(box => {
                    box.parentElement.style.opacity = "1";
                    box.parentElement.style.pointerEvents = "auto";
                    box.parentElement.style.cursor = "pointer";
                });
            }
        });
    });

    // 2. Handle Form Submission
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const btn = form.querySelector("button");
        const originalText = btn.innerHTML;
        //form inputs
        const targetYear = document.getElementById("target_year").value;
        const identityDescription = document.getElementById("identity_description").value;
        const coreValues = Array.from(
            document.querySelectorAll('input[name="core_values"]:checked')
        ).map(cb => cb.value);
        
        const longTermGoals = document.getElementById("long_term_goals").value;
        const anticipatedRegrets = document.getElementById("anticipated_regrets").value;
        const currentLimitations = document.getElementById("current_limitations").value;
        const preferredTone = document.getElementById("preferred_tone").value;
        const commitmentReason = document.getElementById("commitment_reason").value


        // Loading State
        btn.innerHTML = `
            <span>Syncing timeline...</span>
            <div class="spinner"></div>
        `;
        btn.disabled = true;

        submit_form(targetYear, identityDescription, coreValues, longTermGoals, anticipatedRegrets, currentLimitations, preferredTone, commitmentReason);

    });

    // 3. Auto-resize textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(area => {
        area.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        // Trigger once on load to set initial height
        area.style.height = 'auto';
        area.style.height = (area.scrollHeight) + 'px';
    });
});