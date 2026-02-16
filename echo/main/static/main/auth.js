document.addEventListener("DOMContentLoaded", () => {
    // --- Tab Switching ---
    const tabBtns = document.querySelectorAll(".tab-btn");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const linkBtns = document.querySelectorAll(".link-btn");
    const name = document.getElementById("signup_name");
    const email = document.getElementById("signup_email");
    const password = document.getElementById("signup_password");
    const confirm = document.getElementById("signup_confirm");
    const terms = document.querySelector("input[name='terms']");
    const overlay = document.querySelector(".form-overlay");
    const login_username = document.getElementById("login_username");
    const login_password = document.getElementById("login_password");



    async function auth({type, username_input, password_input, email_input=null} = {}){
        try{
            let res;
            if(type == "signup"){
                res = await fetch("/authentication/",{
                    method: "POST",
                    headers:{ "Content-Type": "application/json"},
                    body: JSON.stringify({
                        type:type,
                        username:username_input,
                        email:email_input,
                        password:password_input
                    })
                });
                
                const data = await res.json();

                if(res.status === 400){
                    const usernameErrors = data.errors.username;
                    const emailErrors = data.errors.email;
                    const passwordErrors = data.errors.password;
                    const generalErrors = data.errors.__all__;
                    if(usernameErrors){showError(name, usernameErrors[0])}
                    else if(emailErrors){showError(email, emailErrors[0])}
                    else if(passwordErrors){showError(password, passwordErrors[0])}
                    else if(generalErrors){showError(name, generalErrors[0])}
                }

                else if(res.status === 500 || res.status === 405){
                    alert("Something went wrong, please try again later or contact us");
                    console.error("Failed to authenticate user", data.error);
                }

                else if(res.ok){
                     // Show loading
                    overlay.classList.remove("hidden");
                    overlay.classList.add("active");
                    
                    // Simulate API call
                    setTimeout(() => {
                        overlay.classList.remove("active");
                        overlay.classList.add("hidden");
                        
                        // Show success
                        const successOverlay = document.getElementById("successOverlay");
                        document.getElementById("successTitle").textContent = "Account Created";
                        document.getElementById("successMessage").textContent = "Welcome to Echo. Let's begin.";
                        successOverlay.classList.add("active");
                        
                        // Redirect after delay
                        setTimeout(() => {
                            window.location.href = "/home/";
                        }, 2000);
                    }, 2000);
                    
                }
            }

            else if(type == 'login'){
                res = await fetch("/authentication/",{
                    method: "POST",
                    headers:{ "Content-Type": "application/json"},
                    body: JSON.stringify({
                        type:type,
                        username:username_input,
                        password:password_input
                    })
                });

                const data = await res.json();

                if(res.status === 401){
                    showError(login_username, data.error);
                    showError(login_password, data.error);
                }

                else if(res.status === 500 || res.status === 405){
                    alert("Something went wrong, please try again later or contact us");
                    console.error("Failed to authenticate user", data.error);
                }

                else if(res.ok){
                    // Show loading
                    overlay.classList.remove("hidden");
                    overlay.classList.add("active");
                    
                    // Simulate API call
                    setTimeout(() => {
                        overlay.classList.remove("active");
                        overlay.classList.add("hidden");
                        
                        // Show success
                        const successOverlay = document.getElementById("successOverlay");
                        document.getElementById("successTitle").textContent = "Welcome Back";
                        document.getElementById("successMessage").textContent = "Redirecting to your future self...";
                        successOverlay.classList.add("active");
                        
                        // Redirect after delay
                        setTimeout(() => {
                            window.location.href = "/chat/";
                        }, 2000);
                    }, 2000);
                    
                }
            }
            
        }

        catch(error){
            alert("Something went wrong, please try again later or contact us");
            console.error("Failed to authenticate user", error);
        }
    }

    function switchTab(tabName) {
        // Update tab buttons
        tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Update forms
        if (tabName === "login") {
            loginForm.classList.add("active");
            signupForm.classList.remove("active");
        } else {
            signupForm.classList.add("active");
            loginForm.classList.remove("active");
        }
    }

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            switchTab(btn.dataset.tab);
        });
    });

    linkBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            switchTab(btn.dataset.tab);
        });
    });

    // --- Password Toggle ---
    const togglePasswordBtns = document.querySelectorAll(".toggle-password");
    
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const inputWrapper = btn.closest(".input-wrapper");
            const input = inputWrapper.querySelector("input");
            const eyeIcon = btn.querySelector(".eye-icon");
            
            if (input.type === "password") {
                input.type = "text";
                eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
            } else {
                input.type = "password";
                eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
            }
        });
    });

    // --- Form Validation ---
    function showError(input, message) {
        const formGroup = input.closest(".form-group");
        let errorEl = formGroup.querySelector(".error-message");
        
        if (!errorEl) {
            errorEl = document.createElement("small");
            errorEl.className = "error-message";
            formGroup.appendChild(errorEl);
        }
        
        input.classList.add("input-error");
        errorEl.textContent = message;
        errorEl.classList.add("visible");
    }

    function clearError(input) {
        const formGroup = input.closest(".form-group");
        const errorEl = formGroup.querySelector(".error-message");
        
        input.classList.remove("input-error");
        if (errorEl) {
            errorEl.classList.remove("visible");
        }
    }

    // Clear errors on input
    document.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", () => clearError(input));
    });

    // --- Login Form Submission ---
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Basic validation
        let isValid = true;
        
        if (!login_username.value) {
            showError(login_username, "Please enter a valid email address");
            isValid = false;
        }
        
        if (!login_password.value || login_password.value.length < 8) {
            showError(login_password, "Password must be at least 8 characters");
            isValid = false;
        }
        
        if (!isValid) return;

        auth({type: "login", username_input: login_username.value, password_input: login_password.value});
        
        
    });

    // --- Sign Up Form Submission ---
    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Basic validation
        let isValid = true;
        
        if (!name.value) {
            showError(name, "Please enter your username");
            isValid = false;
        }
        
        if (!email.value || !email.value.includes("@")) {
            showError(email, "Please enter a valid email address");
            isValid = false;
        }
        
        if (!password.value || password.value.length < 8) {
            showError(password, "Password must be at least 8 characters");
            isValid = false;
        }
        
        if (password.value !== confirm.value) {
            showError(confirm, "Passwords do not match");
            isValid = false;
        }
        
        if (!terms.checked) {
            alert("You must agree to the Terms of Service");
            isValid = false;
        }
        
        if (!isValid) return;
        
        auth({type: "signup", email_input: email.value, password_input: password.value, username_input: name.value});
        

    });
});