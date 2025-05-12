document.addEventListener("DOMContentLoaded", function() {
    const guests_add_btn = document.getElementById("guests_add");
    const guests_sub_btn = document.getElementById("guests_subtract");
    const guests_value_elem = document.getElementById("guests_value");
    const guests_view_elem = document.getElementById("guests_view");

    guests_add_btn.addEventListener("click", (e) => {
        e.preventDefault();
        let current = parseInt(guests_view_elem.textContent, 10);
        if (current < 12) {
            current += 1;
            guests_view_elem.textContent = current;
            guests_value_elem.value = current;
        }
    });

    guests_sub_btn.addEventListener("click", (e) => {
        e.preventDefault();
        let current = parseInt(guests_view_elem.textContent, 10);
        if (current > 1) {
            current -= 1;
            guests_view_elem.textContent = current;
            guests_value_elem.value = current;
        }
    });
});