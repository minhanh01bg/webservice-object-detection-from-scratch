import logo from '../assets/img/icons/icons8-fancy-voxel-48.png';

document.getElementById('logo').src = logo;


let form = document.getElementById('formAuthentication');

form.addEventListener('submit', function(event) {
    event.preventDefault();
    let formData = new FormData(form);
    let data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    fetch('http://localhost:3000/api/v1/users/login', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        if (data.status === 200) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/home';
        }
    });
});