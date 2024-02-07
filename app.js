
function validate_password() {

    let password = document.getElementById('password').value;
    let confirm_password = document.getElementById('confirm_password').value;
    if (password != confirm_password) {
        document.getElementById('wrong_password_alert').style.color = 'red';
        document.getElementById('wrong_password_alert').innerHTML
            = '☒ Use same password';
        document.getElementById('create').disabled = true;
        document.getElementById('create').style.opacity = (0.4);
    } else {
        document.getElementById('wrong_pass_alert').style.color = 'green';
        document.getElementById('wrong_pass_alert').innerHTML =
            '🗹 Password Matched';
        document.getElementById('create').disabled = false;
        document.getElementById('create').style.opacity = (1);
    }
}

function wrong_password_alert() {
    if (document.getElementById('password').value != "" &&
        document.getElementById('confirm_password').value != "") {
        alert("Your response is submitted");
    } else {
        alert("Please fill all the fields");
    }
}
