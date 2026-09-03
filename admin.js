/* =========================================================
   HANUMAN CARS
   ADMIN DASHBOARD JAVASCRIPT
   =========================================================

   n8n webhook:
   https://cricwith27.app.n8n.cloud/webhook/hanuman-cars

   Actions:
       get_cars
       add_car
       update_car
       delete_car
       delete_cars

   IMPORTANT:
   Client-side passwords are NOT secure.
   Anyone can inspect this JavaScript file.
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const N8N_WEBHOOK_URL =
    "https://cricwith27.app.n8n.cloud/webhook/hanuman-cars";

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

const SESSION_KEY = "hanumanAdminLoggedIn";

const MAX_PHOTOS = 10;



/* =========================================================
   STATE
   ========================================================= */

let cars = [];
let selectedCars = new Set();
let editingCarId = null;
let temporaryPhotos = [];



/* =========================================================
   DOM ELEMENTS
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

const deleteSelectedButton =
    document.getElementById("deleteSelectedButton");

const carSearch =
    document.getElementById("carSearch");

const carTableBody =
    document.getElementById("carTableBody");

const tableEmpty =
    document.getElementById("tableEmpty");

const selectAllCars =
    document.getElementById("selectAllCars");

const totalCars =
    document.getElementById("totalCars");

const availableCars =
    document.getElementById("availableCars");

const selectedCarsCount =
    document.getElementById("selectedCars");

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
   HELPERS
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



function showLoginError(message) {

    if (loginError) {
        loginError.textContent = message;
    }

    if (adminKeyInput) {
        adminKeyInput.focus();
    }
}



function showFormMessage(
    message,
    type = "success"
) {

    if (!formMessage) {
        return;
    }

    formMessage.textContent = message;

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
   N8N REQUEST
   ========================================================= */

async function sendToN8N(
    action,
    data = {}
) {

    console.log(
        "================================="
    );

    console.log(
        "Sending to n8n:"
    );

    console.log({
        action,
        data
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



        if (!response.ok) {

            throw new Error(
                `n8n HTTP ${response.status}`
            );
        }



        const text =
            await response.text();



        console.log(
            "Raw n8n response:",
            text
        );



        let result = {};



        if (text) {

            try {

                result =
                    JSON.parse(text);

            } catch {

                result = {
                    message: text
                };
            }
        }



        console.log(
            "Parsed n8n response:",
            result
        );



        return {

            success: true,

            result: result

        };



    } catch (error) {

        console.error(
            "n8n request failed:",
            error
        );



        return {

            success: false,

            error: error

        };
    }
}



/* =========================================================
   LOGIN
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
   LOAD CARS
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

        /*
         * IMPORTANT:
         * Do NOT erase existing cars.
         */

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
                JSON.parse(result);

        } catch (error) {

            console.error(
                "Could not parse n8n response:",
                result
            );

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
                    JSON.parse(body);

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

        /*
         * DO NOT CLEAR CARS
         */

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



                    id: String(
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



    selectedCars.clear();



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
   DASHBOARD / SESSION
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



function checkLogin() {

    if (
        sessionStorage.getItem(
            SESSION_KEY
        ) === "true"
    ) {

        showDashboard();
    }
}



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



    selectedCars.clear();



    if (adminKeyInput) {
        adminKeyInput.value = "";
    }
}



/* =========================================================
   SORTING
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
   SEARCH
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
   RENDER TABLE
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

        updateSelectAllState();

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

    updateSelectAllState();
}



/* =========================================================
   CREATE ROW
   ========================================================= */

function createCarRow(car) {

    const image =
        Array.isArray(
            car.photos
        ) &&
        car.photos.length
            ? car.photos[0]
            : "";



    const checked =
        selectedCars.has(
            String(car.id)
        )
            ? "checked"
            : "";



    return `

        <tr data-car-id="${escapeHTML(car.id)}">

            <td>

                <input
                    type="checkbox"
                    class="car-checkbox"
                    data-id="${escapeHTML(car.id)}"
                    ${checked}
                    aria-label="Select ${escapeHTML(
                        car.brand
                    )} ${escapeHTML(
                        car.model
                    )}"
                >

            </td>



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
                        class="table-action edit-car"
                        data-id="${escapeHTML(car.id)}"
                        title="Edit car"
                    >
                        ✏️
                    </button>



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
   ROW EVENTS
   ========================================================= */

function attachRowEvents() {

    document
        .querySelectorAll(
            ".car-checkbox"
        )
        .forEach(
            checkbox => {

                checkbox.addEventListener(
                    "change",
                    function () {

                        const id =
                            String(
                                this.dataset.id
                            );



                        if (
                            this.checked
                        ) {

                            selectedCars.add(
                                id
                            );

                        } else {

                            selectedCars.delete(
                                id
                            );
                        }



                        updateStats();
                        updateSelectAllState();
                    }
                );

            }
        );



    document
        .querySelectorAll(
            ".edit-car"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        editCar(
                            this.dataset.id
                        );
                    }
                );

            }
        );



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
   SELECT ALL
   ========================================================= */

function toggleSelectAll() {

    const filteredCars =
        getFilteredCars();



    if (
        selectAllCars.checked
    ) {

        filteredCars.forEach(
            car => {

                selectedCars.add(
                    String(car.id)
                );

            }
        );

    } else {

        filteredCars.forEach(
            car => {

                selectedCars.delete(
                    String(car.id)
                );

            }
        );
    }



    renderCars();
    updateStats();
}



function updateSelectAllState() {

    if (!selectAllCars) {
        return;
    }



    const filteredCars =
        getFilteredCars();



    if (
        filteredCars.length === 0
    ) {

        selectAllCars.checked =
            false;

        selectAllCars.indeterminate =
            false;

        return;
    }



    const selectedCount =
        filteredCars.filter(
            car =>
                selectedCars.has(
                    String(car.id)
                )
        ).length;



    selectAllCars.checked =
        selectedCount ===
        filteredCars.length;



    selectAllCars.indeterminate =
        selectedCount > 0 &&
        selectedCount <
            filteredCars.length;
}



/* =========================================================
   STATS
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



    if (selectedCarsCount) {

        selectedCarsCount.textContent =
            selectedCars.size;
    }
}



/* =========================================================
   ADD CAR MODAL
   ========================================================= */

function openAddCarModal() {

    editingCarId = null;

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
   CLOSE MODAL
   ========================================================= */

function closeCarModal() {

    if (carModal) {
        carModal.hidden = true;
    }



    document.body.style.overflow =
        "";



    editingCarId = null;

    temporaryPhotos = [];



    if (carPhotos) {
        carPhotos.value = "";
    }
}



/* =========================================================
   EDIT CAR
   ========================================================= */

function editCar(id) {

    const car =
        cars.find(
            item =>
                String(item.id) ===
                String(id)
        );



    if (!car) {
        return;
    }



    editingCarId =
        String(car.id);



    if (modalTitle) {

        modalTitle.textContent =
            "Edit Car";
    }



    if (saveCarButton) {

        saveCarButton.textContent =
            "Update Car";

        saveCarButton.disabled =
            false;
    }



    setField(
        "carId",
        car.id
    );

    setField(
        "carBrand",
        car.brand
    );

    setField(
        "carModel",
        car.model
    );

    setField(
        "carVariant",
        car.variant
    );

    setField(
        "carYear",
        car.year
    );

    setField(
        "carFuel",
        car.fuel
    );

    setField(
        "carTransmission",
        car.transmission
    );

    setField(
        "carKm",
        car.km
    );

    setField(
        "carOwners",
        car.owners
    );

    setField(
        "carRegistration",
        car.registration
    );

    setField(
        "carInsurance",
        car.insurance
    );

    setField(
        "carLocation",
        car.location
    );

    setField(
        "carPrice",
        car.price
    );

    setField(
        "carDescription",
        car.description
    );



    if (
        priceShow &&
        priceContact
    ) {

        if (
            car.showPrice !== false
        ) {

            priceShow.checked =
                true;

            priceContact.checked =
                false;

        } else {

            priceShow.checked =
                false;

            priceContact.checked =
                true;
        }
    }



    temporaryPhotos =
        Array.isArray(
            car.photos
        )
            ? [...car.photos]
            : [];



    updatePriceField();

    renderPhotoPreview();

    clearFormMessage();



    if (carModal) {
        carModal.hidden = false;
    }



    document.body.style.overflow =
        "hidden";
}



/* =========================================================
   SAVE / UPDATE CAR
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



    const isEditing =
        Boolean(
            editingCarId
        );



    let previousCar =
        null;

    let car =
        null;



    /* -----------------------------------------------------
       UPDATE
       ----------------------------------------------------- */

    if (isEditing) {

        const index =
            cars.findIndex(
                item =>
                    String(item.id) ===
                    String(editingCarId)
            );



        if (index === -1) {

            showFormMessage(
                "Car could not be found.",
                "error"
            );

            return;
        }



        previousCar = {

            ...cars[index],

            photos:
                Array.isArray(
                    cars[index].photos
                )
                    ? [
                        ...cars[index].photos
                    ]
                    : []
        };



        car = {

            ...cars[index],

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

            photos:
                [
                    ...temporaryPhotos
                ]
        };



        cars[index] =
            car;
    }



    /* -----------------------------------------------------
       ADD
       ----------------------------------------------------- */

    else {

        car = {

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



        cars.push(car);
    }



    /* -----------------------------------------------------
       DISABLE SAVE BUTTON
       ----------------------------------------------------- */

    if (saveCarButton) {

        saveCarButton.disabled =
            true;

        saveCarButton.textContent =
            isEditing
                ? "Updating..."
                : "Saving...";
    }



    /* -----------------------------------------------------
       SEND TO N8N
       ----------------------------------------------------- */

    const action =
        isEditing
            ? "update_car"
            : "add_car";



    const response =
        await sendToN8N(
            action,
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
            isEditing
                ? "Update Car"
                : "Save Car";
    }



    /* -----------------------------------------------------
       FAILED
       ----------------------------------------------------- */

    if (
        !response.success
    ) {

        if (
            isEditing &&
            previousCar
        ) {

            const index =
                cars.findIndex(
                    item =>
                        String(item.id) ===
                        String(editingCarId)
                );



            if (index !== -1) {

                cars[index] =
                    previousCar;
            }

        } else {

            cars =
                cars.filter(
                    item =>
                        String(item.id) !==
                        String(car.id)
                );
        }



        renderCars();
        updateStats();



        showFormMessage(
            "Could not save to server. Check n8n and browser console.",
            "error"
        );



        console.error(
            "Save failed:",
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



    /*
     * First show the locally saved car.
     * This means the admin table immediately
     * displays the new car.
     */

    renderCars();
    updateStats();



    showFormMessage(
        isEditing
            ? "Car updated successfully."
            : "Car added successfully.",
        "success"
    );



    setTimeout(
        closeCarModal,
        700
    );
}



/* =========================================================
   CREATE CAR ID
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
   DELETE SINGLE CAR
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
            "Could not delete the car from the server."
        );

        return;
    }



    cars =
        cars.filter(
            item =>
                String(item.id) !==
                String(id)
        );



    selectedCars.delete(
        String(id)
    );



    renderCars();
    updateStats();
}



/* =========================================================
   DELETE SELECTED
   ========================================================= */

async function deleteSelectedCars() {

    if (
        selectedCars.size === 0
    ) {

        alert(
            "Select at least one car first."
        );

        return;
    }



    const confirmed =
        confirm(
            `Delete ${selectedCars.size} selected car(s)?\n\nThis action cannot be undone.`
        );



    if (!confirmed) {
        return;
    }



    const deletedCarIds =
        [...selectedCars];



    const response =
        await sendToN8N(
            "delete_cars",
            {
                carIds:
                    deletedCarIds
            }
        );



    if (
        !response.success
    ) {

        alert(
            "Could not delete the selected cars from the server."
        );

        return;
    }



    cars =
        cars.filter(
            car =>
                !selectedCars.has(
                    String(car.id)
                )
        );



    selectedCars.clear();



    renderCars();
    updateStats();
}



/* =========================================================
   PRICE DISPLAY
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
   PHOTO UPLOAD
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
   PHOTO PREVIEW
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
   LOGOUT BUTTON
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
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

    /* LOGIN */

    loginForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            login();
        }
    );



    /* SHOW / HIDE KEY */

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

            } else {

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



    /* ADD */

    addCarButton?.addEventListener(
        "click",
        openAddCarModal
    );



    emptyAddButton?.addEventListener(
        "click",
        openAddCarModal
    );



    /* DELETE SELECTED */

    deleteSelectedButton?.addEventListener(
        "click",
        deleteSelectedCars
    );



    /* SEARCH */

    carSearch?.addEventListener(
        "input",
        renderCars
    );



    /* SELECT ALL */

    selectAllCars?.addEventListener(
        "change",
        toggleSelectAll
    );



    /* CLOSE */

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



    /* FORM */

    carForm?.addEventListener(
        "submit",
        handleCarSubmit
    );



    /* PRICE */

    priceShow?.addEventListener(
        "change",
        updatePriceField
    );



    priceContact?.addEventListener(
        "change",
        updatePriceField
    );



    /* PHOTOS */

    carPhotos?.addEventListener(
        "change",
        handlePhotoUpload
    );



    /* ESCAPE */

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
   INITIALIZE
   ========================================================= */

function initializeAdmin() {

    setupEventListeners();

    updatePriceField();

    createLogoutButton();

    checkLogin();
}



/* =========================================================
   START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAdmin
    );

} else {

    initializeAdmin();
}
