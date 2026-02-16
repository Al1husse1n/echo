document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("futureProfileForm");
    // Select all checkboxes within the values grid
    const valueCheckboxes = document.querySelectorAll(".values-grid input[type='checkbox']");
    const counterDisplay = document.getElementById("valueCount");
    const maxValues = 5;

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

        // Loading State
        btn.innerHTML = `
            <span>Syncing timeline...</span>
            <div class="spinner"></div>
        `;
        btn.disabled = true;

        // Simulate API Call
        setTimeout(() => {
            // Show Success Overlay
            const overlay = document.getElementById("successOverlay");
            overlay.classList.add("active");
            
            // Optional: Actually submit form here if needed
            // form.submit(); 
        }, 2000);
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