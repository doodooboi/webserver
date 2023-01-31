const ip = "https://doodooboi-redesigned-umbrella-7w794jxqx5v2w57g-1820.preview.app.github.dev/auth-api/"

function login() {
  const user = document.getElementById("user")
  const pass = document.getElementById("pass")
  
  const xhttp = new XMLHttpRequest();
  xhttp.open("POST", ip + "login", true);
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.send(JSON.stringify({
    username: user.value,
    password: pass.value
  }));

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      const objects = JSON.parse(this.responseText);
      console.log(objects);
    }
  };
}