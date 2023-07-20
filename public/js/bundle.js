/* eslint-disable node/no-unsupported-features/es-syntax */ // import '@babel/polyfill';
/* eslint-disable */ const $96761fcf66c88173$export$4c5dd147b21b9176 = (locations)=>{
    let map = L.map("map", {
        zoomControl: false
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    const points = [];
    locations.forEach((loc)=>{
        points.push([
            loc.coordinates[1],
            loc.coordinates[0]
        ]);
        L.marker([
            loc.coordinates[1],
            loc.coordinates[0]
        ]).addTo(map).bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
            autoClose: false
        }).openPopup();
    });
    const bounds = L.latLngBounds(points).pad(0.5);
    map.fitBounds(bounds);
    map.scrollWheelZoom.disable();
};


/* eslint-disable */ /* eslint-disable */ const $c6a88cbb7d89dfbc$export$516836c6a9dfc573 = ()=>{
    const el = document.querySelector(".alert");
    if (el) {
        console.log(el.parentElement, el);
        el.parentElement.removeChild("el");
    }
};
const $c6a88cbb7d89dfbc$export$de026b00723010c1 = (type, msg)=>{
    $c6a88cbb7d89dfbc$export$516836c6a9dfc573();
    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
    window.setTimeout($c6a88cbb7d89dfbc$export$516836c6a9dfc573, 5000);
};


const $2182bd3af7eff4ff$export$596d806903d1f59e = async (obj)=>{
    try {
        let res = await fetch("/api/v1/users/login", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: obj.email,
                password: obj.password
            })
        });
        res = await res.json();
        console.log(res);
        if (res.status === "success") {
            (0, $c6a88cbb7d89dfbc$export$de026b00723010c1)("success", "Logged in successfully");
            window.setTimeout(()=>{
                location.assign("/");
            }, 1000);
        } else throw err;
    } catch (err1) {
        // console.log('hi');
        (0, $c6a88cbb7d89dfbc$export$de026b00723010c1)("error", "Please provide valid email or password");
    }
};
const $2182bd3af7eff4ff$export$a0973bcfe11b05c9 = async ()=>{
    try {
        let res = await fetch("/api/v1/users/logout");
        console.log(res);
        if (res.status === 200) location.reload(true);
    } catch (err1) {
        // console.log(err);
        (0, $c6a88cbb7d89dfbc$export$de026b00723010c1)("error", "Error Logging out.");
    }
};


/*eslint-disable*/ 
const $fc2892257a9a50b3$var$jsonFormData = async (formData)=>{
    const plainFormData = Object.fromEntries(formData.entries());
    // console.log(plainFormData);
    return JSON.stringify(plainFormData);
};
const $fc2892257a9a50b3$export$f558026a994b6051 = async (data, type)=>{
    const dt = {
        ...data
    };
    let options = {
        method: "PATCH",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        }
    };
    try {
        let url = "/api/v1/users/";
        if (type === "password") {
            url += "updatePassword";
            options.body = JSON.stringify(dt);
        } else {
            url += "updateMe";
            let form = new FormData();
            form.append("name", dt.name);
            form.append("email", dt.email);
            form.append("photo", dt.photo[0]);
            // console.log(dt.photo[0]);
            options.body = await $fc2892257a9a50b3$var$jsonFormData(form);
        // console.log(await options.body);
        }
        let res = await fetch(url, options);
        if (res.status === 200) // console.log('hi');
        (0, $c6a88cbb7d89dfbc$export$de026b00723010c1)("success", `${type.toUpperCase()} updated successfully`);
    } catch (err) {
        console.log("error", err);
    }
};


// DOM ELEMENTS
const $691131ff80032412$var$leaflet = document.getElementById("map");
const $691131ff80032412$var$loginForm = document.querySelector(".form--login");
const $691131ff80032412$var$logoutBtn = document.querySelector(".nav__el--logout");
const $691131ff80032412$var$userDataForm = document.querySelector(".form-user-data");
const $691131ff80032412$var$userPasswordForm = document.querySelector(".form-user-password");
// VALUES
if ($691131ff80032412$var$leaflet) {
    const locations = JSON.parse(document.getElementById("map").dataset.locations);
    (0, $96761fcf66c88173$export$4c5dd147b21b9176)(locations);
// console.log(locations);
}
if ($691131ff80032412$var$loginForm) $691131ff80032412$var$loginForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    (0, $2182bd3af7eff4ff$export$596d806903d1f59e)({
        email: email,
        password: password
    });
});
if ($691131ff80032412$var$logoutBtn) $691131ff80032412$var$logoutBtn.addEventListener("click", (0, $2182bd3af7eff4ff$export$a0973bcfe11b05c9));
if ($691131ff80032412$var$userDataForm) $691131ff80032412$var$userDataForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const photo = document.getElementById("photo").files;
    (0, $fc2892257a9a50b3$export$f558026a994b6051)({
        name: name,
        email: email,
        photo: photo
    }, "data");
});
if ($691131ff80032412$var$userPasswordForm) $691131ff80032412$var$userPasswordForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    await (0, $fc2892257a9a50b3$export$f558026a994b6051)({
        password: password,
        passwordCurrent: passwordCurrent,
        passwordConfirm: passwordConfirm
    }, "password");
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
});


//# sourceMappingURL=bundle.js.map
