/* =========================================================
   HANUMAN CARS
   ADMIN DASHBOARD JAVASCRIPT
   =========================================================

   n8n webhook:
   https://cricwith27.app.n8n.cloud/webhook/hanuman-cars

   Actions:
       get_cars
       add_car
       delete_car

   IMPORTANT:
   Client-side passwords are NOT secure.
   Anyone can inspect this JavaScript file.
   ========================================================= */


/* =========================================================
   1. CONFIGURATION
   ========================================================= */

const N8N_WEBHOOK_URL =
    "https://cricwith27.app.n8n.cloud/webhook-test/hanuman-cars";


const ADMIN_KEYS = [
    "HANUMAN",
    "arjun",
    "ARJUN",
    "mallika",
    "MALLESWARI",
    "MALLIKA",
    "malleswari",
    "RAJESH",
    "rajesh",
    "abhiram",
    "ABHIRAM"
];


const SESSION_KEY =
    "hanumanAdminLoggedIn";


const MAX_PHOTOS = 10;


/* =========================================================
   2. STATE
   ========================================================= */

let cars = [];

let temporaryPhotos = [];


/* =========================================================
   3. DOM ELEMENTS
   ========================================================= */

const loginSection =
    document.getElementById("loginSection");


const dashboard =
    document.getElementById("dashboard");


const loginForm =
    document.getElementById("loginForm");


const adminKeyInput =
    document.getElementById("adminKey");


const toggleKey =
    document.getElementById("toggleKey");


const loginError =
    document.getElementById("loginError");


const addCarButton =
    document.getElementById("addCarButton");


const emptyAddButton =
    document.getElementById("emptyAddButton");


const carSearch =
    document.getElementById("carSearch");


const carTableBody =
    document.getElementById("carTableBody");


const tableEmpty =
    document.getElementById("tableEmpty");


const totalCars =
    document.getElementById("totalCars");


const availableCars =
    document.getElementById("availableCars");


const carModal =
    document.getElementById("carModal");


const modalOverlay =
    document.getElementById("modalOverlay");


const closeModal =
    document.getElementById("closeModal");


const cancelCar =
    document.getElementById("cancelCar");


const carForm =
    document.getElementById("carForm");


const modalTitle =
    document.getElementById("modalTitle");


const saveCarButton =
    document.getElementById("saveCar");


const formMessage =
    document.getElementById("formMessage");


const priceShow =
    document.getElementById("priceShow");


const priceContact =
    document.getElementById("priceContact");


const priceInputGroup =
    document.getElementById("priceInputGroup");


const carPhotos =
    document.getElementById("carPhotos");


const photoPreview =
    document.getElementById("photoPreview");


const photoCount =
    document.getElementById("photoCount");


/* =========================================================
   4. HELPERS
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function getValue(id) {

    return (
        document.getElementById(id)?.value.trim() || ""
    );
}


function setField(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value = value ?? "";
    }
}


/* =========================================================
   5. LOGIN ERROR
   ========================================================= */

function showLoginError(message) {

    if (loginError) {
        loginError.textContent = message;
    }

    if (adminKeyInput) {
        adminKeyInput.focus();
    }
}


/* =========================================================
   6. FORM MESSAGE
   ========================================================= */

function showFormMessage(
    message,
    type = "success"
) {

    if (!formMessage) {
        return;
    }

    formMessage.textContent =
        message;

    formMessage.style.color =
        type === "error"
            ? "#d93025"
            : "#188038";
}


function clearFormMessage() {

    if (formMessage) {
        formMessage.textContent = "";
    }
}


/* =========================================================
   7. N8N REQUEST
   ========================================================= */

async function sendToN8N(
    action,
    data = {}
) {

    console.log(
        "================================="
    );

    console.log(
        "Sending request to n8n"
    );

    console.log({
        action: action,
        data: data
    });

    console.log(
        "Webhook:",
        N8N_WEBHOOK_URL
    );

    console.log(
        "================================="
    );


    try {

        const response =
            await fetch(
                N8N_WEBHOOK_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        action: action,

                        data: data,

                        timestamp:
                            new Date()
                                .toISOString()

                    })
                }
            );


        console.log(
            "n8n HTTP status:",
            response.status
        );


        const responseText =
            await response.text();


        console.log(
            "Raw n8n response:",
            responseText
        );


        if (!response.ok) {

            throw new Error(
                `n8n HTTP ${response.status}: ${responseText || "No response body"}`
            );
        }


        let result = {};


        if (responseText) {

            try {

                result =
                    JSON.parse(
                        responseText
                    );

            } catch {

                result = {
                    message:
                        responseText
                };

            }

        }


        console.log(
            "Parsed n8n response:",
            result
        );


        return {

            success: true,

            result: result,

            status:
                response.status

        };


    } catch (error) {

        console.error(
            "n8n request failed:",
            error
        );


        return {

            success: false,

            error: error,

            message:
                error?.message ||
                "Unknown network error"

        };

    }

}


/* =========================================================
   8. LOGIN
   ========================================================= */

function login() {

    const enteredKey =
        adminKeyInput?.value || "";


    if (!enteredKey) {

        showLoginError(
            "Please enter the admin key."
        );

        return;
    }


    const authenticated =
        ADMIN_KEYS.includes(
            enteredKey
        );


    if (authenticated) {

        sessionStorage.setItem(
            SESSION_KEY,
            "true"
        );


        if (loginError) {
            loginError.textContent = "";
        }


        if (adminKeyInput) {
            adminKeyInput.value = "";
        }


        showDashboard();

        return;
    }


    showLoginError(
        "Incorrect admin key."
    );

}


/* =========================================================
   9. LOAD CARS
   ========================================================= */

async function loadCars() {

    console.log(
        "================================="
    );

    console.log(
        "Loading cars from n8n..."
    );

    console.log(
        "================================="
    );


    const response =
        await sendToN8N(
            "get_cars"
        );


    /* -----------------------------------------------------
       REQUEST FAILED
       ----------------------------------------------------- */

    if (!response.success) {

        console.error(
            "GET CARS FAILED:",
            response.error
        );


        cars = [];


        renderCars();

        updateStats();


        return false;
    }


    let result =
        response.result;


    console.log(
        "RAW GET CARS RESPONSE:",
        result
    );


    /* -----------------------------------------------------
       PARSE STRING RESPONSE
       ----------------------------------------------------- */

    if (
        typeof result ===
        "string"
    ) {

        try {

            result =
                JSON.parse(
                    result
                );

        } catch (error) {

            console.error(
                "Could not parse n8n response:",
                result
            );


            cars = [];


            renderCars();

            updateStats();


            return false;
        }

    }


    let loadedCars = [];


    /* -----------------------------------------------------
       POSSIBLE RESPONSE FORMATS
       ----------------------------------------------------- */

    if (
        Array.isArray(result)
    ) {

        loadedCars =
            result;

    }


    else if (
        result &&
        Array.isArray(
            result.cars
        )
    ) {

        loadedCars =
            result.cars;

    }


    else if (
        result &&
        Array.isArray(
            result.data
        )
    ) {

        loadedCars =
            result.data;

    }


    else if (
        result &&
        Array.isArray(
            result.items
        )
    ) {

        loadedCars =
            result.items;

    }


    else if (
        result &&
        result.body
    ) {

        let body =
            result.body;


        if (
            typeof body ===
            "string"
        ) {

            try {

                body =
                    JSON.parse(
                        body
                    );

            } catch {

                body = null;

            }

        }


        if (
            Array.isArray(body)
        ) {

            loadedCars =
                body;

        }


        else if (
            body &&
            Array.isArray(
                body.cars
            )
        ) {

            loadedCars =
                body.cars;

        }


        else if (
            body &&
            Array.isArray(
                body.data
            )
        ) {

            loadedCars =
                body.data;

        }


        else if (
            body &&
            Array.isArray(
                body.items
            )
        ) {

            loadedCars =
                body.items;

        }

    }


    /* -----------------------------------------------------
       VALIDATION
       ----------------------------------------------------- */

    if (
        !Array.isArray(
            loadedCars
        )
    ) {

        console.error(
            "GET CARS did not return a valid array."
        );

        console.error(
            "Response was:",
            result
        );


        cars = [];


        renderCars();

        updateStats();


        return false;
    }


    console.log(
        "Cars received from server:",
        loadedCars.length
    );


    /* -----------------------------------------------------
       NORMALIZE CARS
       ----------------------------------------------------- */

    cars =
        loadedCars.map(
            car => {

                let photos =
                    car.photos;


                /*
                 * Photos may be stored
                 * as JSON text in Google Sheets.
                 */

                if (
                    typeof photos ===
                    "string"
                ) {

                    try {

                        photos =
                            JSON.parse(
                                photos
                            );

                    } catch {

                        photos =
                            photos
                                ? [photos]
                                : [];

                    }

                }


                if (
                    !Array.isArray(
                        photos
                    )
                ) {

                    photos = [];

                }


                return {

                    ...car,

                    id:
                        String(
                            car.id ??
                            car.ID ??
                            car.Id ??
                            ""
                        ),


                    brand:
                        car.brand ??
                        car.Brand ??
                        "",


                    model:
                        car.model ??
                        car.Model ??
                        "",


                    variant:
                        car.variant ??
                        car.Variant ??
                        "",


                    year:
                        car.year ??
                        car.Year ??
                        "",


                    fuel:
                        car.fuel ??
                        car.Fuel ??
                        "",


                    transmission:
                        car.transmission ??
                        car.Transmission ??
                        "",


                    km:
                        car.km ??
                        car.KM ??
                        car.Km ??
                        "",


                    owners:
                        car.owners ??
                        car.Owners ??
                        "",


                    registration:
                        car.registration ??
                        car.Registration ??
                        "",


                    insurance:
                        car.insurance ??
                        car.Insurance ??
                        "",


                    location:
                        car.location ??
                        car.Location ??
                        "Vijayawada",


                    price:
                        car.price ??
                        car.Price ??
                        "",


                    description:
                        car.description ??
                        car.Description ??
                        "",


                    photos:
                        photos,


                    status:
                        car.status ??
                        car.Status ??
                        "Available",


                    showPrice:
                        car.showPrice !== false &&
                        car.showPrice !== "false",


                    addedAt:
                        car.addedAt ??
                        car.added_at ??
                        car.AddedAt ??
                        new Date()
                            .toISOString()

                };

            }
        );


    renderCars();

    updateStats();


    console.log(
        "================================="
    );

    console.log(
        "FINAL CARS IN ADMIN:",
        cars
    );

    console.log(
        "TOTAL CARS:",
        cars.length
    );

    console.log(
        "================================="
    );


    return true;

}


/* =========================================================
   10. DASHBOARD / SESSION
   ========================================================= */

async function showDashboard() {

    if (loginSection) {
        loginSection.hidden = true;
    }


    if (dashboard) {
        dashboard.hidden = false;
    }


    await loadCars();

}


/* =========================================================
   11. CHECK LOGIN
   ========================================================= */

function checkLogin() {

    if (
        sessionStorage.getItem(
            SESSION_KEY
        ) === "true"
    ) {

        showDashboard();

    }

}


/* =========================================================
   12. LOGOUT
   ========================================================= */

function logout() {

    sessionStorage.removeItem(
        SESSION_KEY
    );


    if (dashboard) {
        dashboard.hidden = true;
    }


    if (loginSection) {
        loginSection.hidden = false;
    }


    if (adminKeyInput) {
        adminKeyInput.value = "";
    }

}


/* =========================================================
   13. SORTING
   ========================================================= */

function getSortedCars() {

    return [...cars].sort(
        (a, b) =>
            new Date(
                b.addedAt || 0
            ) -
            new Date(
                a.addedAt || 0
            )
    );

}


/* =========================================================
   14. SEARCH
   ========================================================= */

function getFilteredCars() {

    const query =
        carSearch?.value
            .trim()
            .toLowerCase() || "";


    const sorted =
        getSortedCars();


    if (!query) {
        return sorted;
    }


    return sorted.filter(
        car => {

            const searchableText = [

                car.brand,

                car.model,

                car.variant,

                car.year,

                car.fuel,

                car.transmission,

                car.km,

                car.location,

                car.registration

            ]
                .join(" ")
                .toLowerCase();


            return searchableText.includes(
                query
            );

        }
    );

}


/* =========================================================
   15. RENDER TABLE
   ========================================================= */

function renderCars() {

    if (
        !carTableBody ||
        !tableEmpty
    ) {

        return;

    }


    const filteredCars =
        getFilteredCars();


    if (
        filteredCars.length === 0
    ) {

        carTableBody.innerHTML = "";

        tableEmpty.hidden = false;

        return;

    }


    tableEmpty.hidden = true;


    carTableBody.innerHTML =
        filteredCars
            .map(
                createCarRow
            )
            .join("");


    attachRowEvents();

}


/* =========================================================
   16. CREATE ROW
   ========================================================= */

function createCarRow(car) {

    const image =
        Array.isArray(
            car.photos
        ) &&
        car.photos.length
            ? car.photos[0]
            : "";


    return `

        <tr data-car-id="${escapeHTML(car.id)}">

            <td>

                <div class="car-table-info">

                    ${
                        image
                            ? `
                                <img
                                    class="car-table-image"
                                    src="${escapeHTML(image)}"
                                    alt=""
                                >
                              `
                            : `
                                <div
                                    class="car-table-image"
                                ></div>
                              `
                    }

                    <div>

                        <div class="car-table-name">

                            ${escapeHTML(
                                car.brand
                            )}

                            ${escapeHTML(
                                car.model
                            )}

                        </div>


                        <div class="car-table-brand">

                            ${escapeHTML(
                                car.variant || ""
                            )}

                        </div>

                    </div>

                </div>

            </td>


            <td>
                ${escapeHTML(
                    String(
                        car.year || "-"
                    )
                )}
            </td>


            <td>
                ${escapeHTML(
                    car.fuel || "-"
                )}
            </td>


            <td>
                ${escapeHTML(
                    car.km || "-"
                )}
            </td>


            <td>

                ${
                    car.showPrice
                        ? escapeHTML(
                            car.price || "-"
                        )
                        : "Contact"
                }

            </td>


            <td>

                <span class="status status-available">

                    ${escapeHTML(
                        car.status ||
                        "Available"
                    )}

                </span>

            </td>


            <td>

                <div class="table-actions">

                    <button
                        type="button"
                        class="table-action delete delete-car"
                        data-id="${escapeHTML(car.id)}"
                        title="Delete car"
                    >
                        🗑️
                    </button>

                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   17. ROW EVENTS
   ========================================================= */

function attachRowEvents() {

    document
        .querySelectorAll(
            ".delete-car"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        deleteCar(
                            this.dataset.id
                        );

                    }
                );

            }
        );

}


/* =========================================================
   18. STATS
   ========================================================= */

function updateStats() {

    if (totalCars) {

        totalCars.textContent =
            cars.length;

    }


    if (availableCars) {

        availableCars.textContent =
            cars.filter(
                car =>
                    String(
                        car.status || ""
                    ).toLowerCase() !==
                    "sold"
            ).length;

    }

}


/* =========================================================
   19. ADD CAR MODAL
   ========================================================= */

function openAddCarModal() {

    temporaryPhotos = [];


    if (modalTitle) {

        modalTitle.textContent =
            "Add New Car";

    }


    if (saveCarButton) {

        saveCarButton.textContent =
            "Save Car";

        saveCarButton.disabled =
            false;

    }


    carForm?.reset();


    setField(
        "carLocation",
        "Vijayawada"
    );


    if (priceShow) {
        priceShow.checked = true;
    }


    if (priceContact) {
        priceContact.checked = false;
    }


    updatePriceField();

    renderPhotoPreview();

    clearFormMessage();


    if (carModal) {
        carModal.hidden = false;
    }


    document.body.style.overflow =
        "hidden";


    document
        .getElementById(
            "carBrand"
        )
        ?.focus();

}


/* =========================================================
   20. CLOSE MODAL
   ========================================================= */

function closeCarModal() {

    if (carModal) {
        carModal.hidden = true;
    }


    document.body.style.overflow =
        "";


    temporaryPhotos = [];


    if (carPhotos) {
        carPhotos.value = "";
    }

}


/* =========================================================
   21. SAVE CAR
   ========================================================= */

async function handleCarSubmit(
    event
) {

    event.preventDefault();

    clearFormMessage();


    const brand =
        getValue("carBrand");


    const model =
        getValue("carModel");


    const variant =
        getValue("carVariant");


    const year =
        getValue("carYear");


    const fuel =
        getValue("carFuel");


    const transmission =
        getValue("carTransmission");


    const km =
        getValue("carKm");


    const owners =
        getValue("carOwners");


    const registration =
        getValue("carRegistration");


    const insurance =
        document.getElementById(
            "carInsurance"
        )?.value || "";


    const location =
        getValue("carLocation");


    const price =
        getValue("carPrice");


    const description =
        getValue(
            "carDescription"
        );


    const showPrice =
        priceShow?.checked ?? true;


    /* -----------------------------------------------------
       VALIDATION
       ----------------------------------------------------- */

    if (
        !brand ||
        !model ||
        !year
    ) {

        showFormMessage(
            "Please fill all required fields.",
            "error"
        );

        return;

    }


    if (
        showPrice &&
        !price
    ) {

        showFormMessage(
            "Enter a price or select Contact for Price.",
            "error"
        );

        return;

    }


    /* -----------------------------------------------------
       CREATE CAR
       ----------------------------------------------------- */

    const car = {

        id:
            createCarId(
                brand,
                model
            ),


        brand,

        model,

        variant,


        year:
            Number(year),


        fuel,

        transmission,

        km,

        owners,

        registration,

        insurance,

        location,

        price,

        showPrice,

        description,


        /*
         * ALL PHOTOS BELONG TO THIS ONE CAR
         */

        photos:
            [
                ...temporaryPhotos
            ],


        status:
            "Available",


        addedAt:
            new Date()
                .toISOString()

    };


    console.log(
        "CAR BEING SENT:",
        car
    );


    /* -----------------------------------------------------
       DISABLE SAVE BUTTON
       ----------------------------------------------------- */

    if (saveCarButton) {

        saveCarButton.disabled =
            true;

        saveCarButton.textContent =
            "Saving...";

    }


    showFormMessage(
        "Saving car...",
        "success"
    );


    /* -----------------------------------------------------
       SEND TO N8N
       ----------------------------------------------------- */

    const response =
        await sendToN8N(
            "add_car",
            {
                car: car
            }
        );


    /* -----------------------------------------------------
       RESTORE BUTTON
       ----------------------------------------------------- */

    if (saveCarButton) {

        saveCarButton.disabled =
            false;

        saveCarButton.textContent =
            "Save Car";

    }


    /* -----------------------------------------------------
       FAILED
       ----------------------------------------------------- */

    if (
        !response.success
    ) {

        const errorMessage =
            response.message ||
            response.error?.message ||
            "Unknown network error.";


        showFormMessage(
            `Could not save: ${errorMessage}`,
            "error"
        );


        console.error(
            "SAVE FAILED:",
            response.error
        );


        return;

    }


    /* -----------------------------------------------------
       SERVER SAVE SUCCESS
       ----------------------------------------------------- */

    console.log(
        "Car successfully sent to n8n."
    );


    console.log(
        "Server response:",
        response.result
    );


    /*
     * Add the car locally so it immediately
     * appears in the admin table.
     */

    cars.push(car);


    renderCars();

    updateStats();


    showFormMessage(
        "Car added successfully.",
        "success"
    );


    setTimeout(
        closeCarModal,
        700
    );

}


/* =========================================================
   22. CREATE CAR ID
   ========================================================= */

function createCarId(
    brand,
    model
) {

    const base =
        `${brand}-${model}`
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-|-$/g,
                ""
            );


    let id =
        base || "car";


    let counter =
        1;


    while (
        cars.some(
            car =>
                String(car.id) ===
                String(id)
        )
    ) {

        id =
            `${base}-${counter}`;


        counter++;

    }


    return id;

}


/* =========================================================
   23. DELETE SINGLE CAR
   ========================================================= */

async function deleteCar(id) {

    const car =
        cars.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!car) {
        return;
    }


    const confirmed =
        confirm(
            `Delete ${car.brand} ${car.model}?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    const response =
        await sendToN8N(
            "delete_car",
            {
                carId: car.id
            }
        );


    if (
        !response.success
    ) {

        alert(
            `Could not delete the car.\n\n${response.message || "Network error."}`
        );


        return;
    }


    cars =
        cars.filter(
            item =>
                String(item.id) !==
                String(id)
        );


    renderCars();

    updateStats();

}


/* =========================================================
   24. PRICE DISPLAY
   ========================================================= */

function updatePriceField() {

    if (!priceInputGroup) {
        return;
    }


    priceInputGroup.hidden =
        priceContact?.checked ??
        false;

}


/* =========================================================
   25. PHOTO UPLOAD
   ========================================================= */

function handlePhotoUpload(
    event
) {

    const files =
        Array.from(
            event.target.files || []
        );


    if (!files.length) {
        return;
    }


    const remainingSlots =
        MAX_PHOTOS -
        temporaryPhotos.length;


    if (
        remainingSlots <= 0
    ) {

        alert(
            `Maximum ${MAX_PHOTOS} photos allowed.`
        );


        if (carPhotos) {
            carPhotos.value = "";
        }


        return;
    }


    const filesToAdd =
        files.slice(
            0,
            remainingSlots
        );


    filesToAdd.forEach(
        file => {

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                console.warn(
                    "Skipped non-image file:",
                    file.name
                );


                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                () => {

                    temporaryPhotos.push(
                        reader.result
                    );


                    renderPhotoPreview();

                };


            reader.onerror =
                () => {

                    console.error(
                        "Could not read image:",
                        file.name
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );


    if (
        files.length >
        remainingSlots
    ) {

        alert(
            `Only ${MAX_PHOTOS} photos can be added.`
        );

    }


    if (carPhotos) {
        carPhotos.value = "";
    }

}


/* =========================================================
   26. PHOTO PREVIEW
   ========================================================= */

function renderPhotoPreview() {

    if (photoCount) {

        photoCount.textContent =
            `${temporaryPhotos.length} / ${MAX_PHOTOS}`;

    }


    if (!photoPreview) {
        return;
    }


    if (
        temporaryPhotos.length ===
        0
    ) {

        photoPreview.innerHTML =
            "";

        return;
    }


    photoPreview.innerHTML =

        temporaryPhotos
            .map(
                (
                    photo,
                    index
                ) => `

                    <div class="preview-item">

                        <img
                            src="${escapeHTML(photo)}"
                            alt="Car photo ${index + 1}"
                        >

                        <button
                            type="button"
                            class="remove-photo"
                            data-photo-index="${index}"
                            aria-label="Remove photo"
                        >
                            ✕
                        </button>

                    </div>

                `
            )
            .join("");


    photoPreview
        .querySelectorAll(
            ".remove-photo"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset
                                    .photoIndex
                            );


                        temporaryPhotos.splice(
                            index,
                            1
                        );


                        renderPhotoPreview();

                    }
                );

            }
        );

}


/* =========================================================
   27. LOGOUT BUTTON
   ========================================================= */

function createLogoutButton() {

    const header =
        document.querySelector(
            ".admin-header"
        );


    if (!header) {
        return;
    }


    if (
        document.getElementById(
            "logoutButton"
        )
    ) {

        return;
    }


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "logoutButton";


    button.className =
        "btn btn-secondary";


    button.textContent =
        "Logout";


    button.type =
        "button";


    button.addEventListener(
        "click",
        logout
    );


    header.appendChild(
        button
    );

}


/* =========================================================
   28. EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

    /* -----------------------------------------------------
       LOGIN
       ----------------------------------------------------- */

    loginForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            login();

        }
    );


    /* -----------------------------------------------------
       SHOW / HIDE KEY
       ----------------------------------------------------- */

    toggleKey?.addEventListener(
        "click",
        () => {

            if (!adminKeyInput) {
                return;
            }


            if (
                adminKeyInput.type ===
                "password"
            ) {

                adminKeyInput.type =
                    "text";


                toggleKey.textContent =
                    "🙈";


                toggleKey.setAttribute(
                    "aria-label",
                    "Hide admin key"
                );

            }


            else {

                adminKeyInput.type =
                    "password";


                toggleKey.textContent =
                    "👁";


                toggleKey.setAttribute(
                    "aria-label",
                    "Show admin key"
                );

            }

        }
    );


    /* -----------------------------------------------------
       ADD
       ----------------------------------------------------- */

    addCarButton?.addEventListener(
        "click",
        openAddCarModal
    );


    emptyAddButton?.addEventListener(
        "click",
        openAddCarModal
    );


    /* -----------------------------------------------------
       SEARCH
       ----------------------------------------------------- */

    carSearch?.addEventListener(
        "input",
        renderCars
    );


    /* -----------------------------------------------------
       CLOSE
       ----------------------------------------------------- */

    closeModal?.addEventListener(
        "click",
        closeCarModal
    );


    cancelCar?.addEventListener(
        "click",
        closeCarModal
    );


    modalOverlay?.addEventListener(
        "click",
        closeCarModal
    );


    /* -----------------------------------------------------
       FORM
       ----------------------------------------------------- */

    carForm?.addEventListener(
        "submit",
        handleCarSubmit
    );


    /* -----------------------------------------------------
       PRICE
       ----------------------------------------------------- */

    priceShow?.addEventListener(
        "change",
        updatePriceField
    );


    priceContact?.addEventListener(
        "change",
        updatePriceField
    );


    /* -----------------------------------------------------
       PHOTOS
       ----------------------------------------------------- */

    carPhotos?.addEventListener(
        "change",
        handlePhotoUpload
    );


    /* -----------------------------------------------------
       ESCAPE
       ----------------------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                carModal &&
                !carModal.hidden
            ) {

                closeCarModal();

            }

        }
    );

}


/* =========================================================
   29. INITIALIZE
   ========================================================= */

function initializeAdmin() {

    setupEventListeners();

    updatePriceField();

    createLogoutButton();

    checkLogin();

}


/* =========================================================
   30. START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAdmin
    );

}

else {

    initializeAdmin();

}
