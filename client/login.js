const ip = "https://caca.onthewifi.com/auth/"

function login() {
  const user = document.getElementById("user")
  const pass = document.getElementById("pass")
  const statusBox = document.getElementById("status")
  var style = getComputedStyle(document.body)
  
  const xhttp = new XMLHttpRequest();
  xhttp.open("POST", ip + "login", true);
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.send(JSON.stringify({
    username: user.value,
    password: pass.value
  }));

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      const objects = JSON.parse(this.responseText);

      statusBox.style.display = "flex"
      statusBox.style.opacity = 100

      setTimeout(() => {
        statusBox.style.display = "none"
        statusBox.style.opacity = 0
      }, 1500);

      if (this.status == 403) {
        statusBox.style.backgroundColor = style.getPropertyValue("--error")
        statusBox.style.borderColor = style.getPropertyValue("--errorborder")
      } else if (this.status === 200) {
        statusBox.style.backgroundColor = style.getPropertyValue("--success")
        statusBox.style.borderColor = style.getPropertyValue("--successborder")
      }

      statusBox.innerHTML = "<p><span class='response'>" + this.status.toString() + ":</span> " + objects.response + "</p>"
    }
  };

  return false;
}
