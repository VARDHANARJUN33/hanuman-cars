/* =========================================================
   HANUMAN CARS
   Customer Website JavaScript
   Google Sheets → n8n → Customer Website
   ========================================================= */


/* =========================================================
   1. BUSINESS SETTINGS
   ========================================================= */

const BUSINESS = {
    name: "Hanuman Cars",
    location: "Gangur, Vijayawada",
    phone: "9866447000",
    whatsapp: "919866447000"
};


/* =========================================================
   2. CUSTOMER CARS API
   ========================================================= */

// TEST URL while testing in n8n
const CARS_API_URL =
    "https://cricwith27.app.n8n.cloud/webhook-test/cars";

// After activating n8n, change to:
// https://cricwith27.app.n8n.cloud/webhook/cars


/* =========================================================
   3. CAR DATA
   ========================================================= */

let cars = [];


/* =========================================================
   4. WHATSAPP HELPER
   ========================================================= */

function createWhatsAppLink(message) {

    return (
        "https://wa.me/" +
        BUSINESS.whatsapp +
        "?text=" +
        encodeURIComponent(message)
    );

}


/* =========================================================
   5. PRICE HELPER
   ========================================================= */

function getPriceText(car) {

    if (
        car.showPrice === true ||
        car.showPrice === "true" ||
        car.showPrice === "TRUE" ||
        car.showPrice === 1 ||
        car.showPrice === "1"
    ) {
        return car.price || "Contact for Price";
    }

    return "Contact for Price";

}


/* =========================================================
   6. NORMALIZE CAR DATA
   Exact Google Sheets headings are supported here.
   ========================================================= */

function normalizeCar(car, index) {

    return {

        /* -------------------------
           ID
           ------------------------- */

        id:
            car.id ||
            car.ID ||
            car.carId ||
            `car-${index + 1}`,


        /* -------------------------
           BASIC DETAILS
           ------------------------- */

        brand:
            car.Brand ||
            car.brand ||
            "",

        model:
            car.Model ||
            car.model ||
            "",

        variant:
            car.variant ||
            car.Variant ||
            "",


        /* -------------------------
           YEAR
           Google Sheet:
           Manufacturing/Model Year
           ------------------------- */

        year:
            car["Manufacturing/Model Year"] ||
            car["Manufacturing / Model Year"] ||
            car.Year ||
            car.year ||
            "",


        /* -------------------------
           FUEL
           Google Sheet:
           Fuel Type
           ------------------------- */

        fuel:
            car["Fuel Type"] ||
            car.Fuel ||
            car.fuel ||
            "",


        /* -------------------------
           TRANSMISSION
           ------------------------- */

        transmission:
            car.Transmission ||
            car.transmission ||
            "",


        /* -------------------------
           KILOMETRES
           Google Sheet:
           Kilometres
           ------------------------- */

        km:
            car.Kilometres ||
            car.kilometres ||
            car.KM ||
            car.km ||
            "",


        /* -------------------------
           OWNERS
           Google Sheet:
           Number of Owners
           ------------------------- */

        owners:
            car["Number of Owners"] ||
            car.Owners ||
            car.owners ||
            "",


        /* -------------------------
           REGISTRATION
           ------------------------- */

        registration:
            car.Registration ||
            car.registration ||
            "",


        /* -------------------------
           INSURANCE
           ------------------------- */

        insurance:
            car.Insurance ||
            car.insurance ||
            "",


        /* -------------------------
           LOCATION
           ------------------------- */

        location:
            car.Location ||
            car.location ||
            BUSINESS.location,


        /* -------------------------
           PRICE
           ------------------------- */

        price:
            car.Price ||
            car.price ||
            "",


        /* -------------------------
           SHOW PRICE
           ------------------------- */

        showPrice:
            car.showPrice ??
            car.ShowPrice ??
            true,


        /* -------------------------
           DESCRIPTION
           ------------------------- */

        description:
            car.Description ||
            car.description ||
            "Contact Hanuman Cars for complete details and availability.",


        /* -------------------------
           DATE ADDED
           ------------------------- */

        addedAt:
            car.addedAt ||
            car.AddedAt ||
            new Date().toISOString(),


        /* -------------------------
           CAR PHOTOS
           Google Sheet:
           Car Photos
           ------------------------- */

        photos:
            normalizePhotos(
                car["Car Photos"] ||
                car["car photos"] ||
                car["CAR PHOTOS"] ||
                car.CarPhotos ||
                car.Photos ||
                car.photos ||
                car.photo ||
                car.image ||
                car.images
            )

    };

}


/* =========================================================
   7. NORMALIZE PHOTOS
   ========================================================= */

function normalizePhotos(photos) {

    if (!photos) {
        return [];
    }


    /* -------------------------
       Already an array
       ------------------------- */

    if (Array.isArray(photos)) {

        return photos
            .filter(Boolean)
            .map(photo => String(photo).trim())
            .filter(Boolean);

    }


    /* -------------------------
       String
       Supports comma-separated
       or newline-separated URLs
       ------------------------- */

    if (typeof photos === "string") {

        return photos
            .split(/[\n,]+/)
            .map(photo => photo.trim())
            .filter(Boolean);

    }


    return [];

}


/* =========================================================
   8. LOAD CARS FROM N8N
   ========================================================= */

async function loadCars() {

    const carList =
        document.getElementById("carList");


    /* -------------------------
       Loading state
       ------------------------- */

    if (carList) {

        carList.innerHTML = `

            <div class="empty-state">

                <h3>
                    Loading cars...
                </h3>

                <p>
                    Please wait while we load
                    the latest cars.
                </p>

            </div>

        `;

    }


    try {

        const response =
            await fetch(CARS_API_URL, {

                method: "GET",

                headers: {
                    "Accept": "application/json"
                }

            });


        /* -------------------------
           HTTP error
           ------------------------- */

        if (!response.ok) {

            throw new Error(
                `HTTP error: ${response.status}`
            );

        }


        /* -------------------------
           Read JSON
           ------------------------- */

        const data =
            await response.json();


        console.log(
            "================================="
        );

        console.log(
            "Cars received from n8n:"
        );

        console.log(data);

        console.log(
            "================================="
        );


        /* -------------------------
           Detect n8n response format
           ------------------------- */

        let receivedCars = [];


        if (Array.isArray(data)) {

            receivedCars = data;

        }

        else if (
            data &&
            Array.isArray(data.cars)
        ) {

            receivedCars = data.cars;

        }

        else if (
            data &&
            Array.isArray(data.data)
        ) {

            receivedCars = data.data;

        }

        else if (
            data &&
            typeof data === "object"
        ) {

            receivedCars = [data];

        }


        /* -------------------------
           Normalize every car
           ------------------------- */

        cars =
            receivedCars.map(
                (car, index) =>
                    normalizeCar(car, index)
            );


        console.log(
            "Normalized cars:"
        );

        console.log(cars);


        /* -------------------------
           Display homepage cars
           ------------------------- */

        displayCars();


        /* -------------------------
           Display car details page
           ------------------------- */

        displayCarDetails();

    }


    catch (error) {

        console.error(
            "Failed to load cars:",
            error
        );


        if (carList) {

            carList.innerHTML = `

                <div class="empty-state">

                    <h3>
                        Unable to load cars
                    </h3>

                    <p>
                        Please try again later
                        or contact Hanuman Cars.
                    </p>

                </div>

            `;

        }

    }

}


/* =========================================================
   9. SORT CARS
   ========================================================= */

function getSortedCars() {

    return [...cars].sort(
        (a, b) => {

            return (
                new Date(b.addedAt) -
                new Date(a.addedAt)
            );

        }
    );

}


/* =========================================================
   10. CREATE CAR CARD
   ========================================================= */

function createCarCard(car, index) {

    const image =
        car.photos &&
        car.photos.length > 0
            ? car.photos[0]
            : "";


    const recentBadge =
        index === 0
            ? `<span class="badge">Recently Added</span>`
            : "";


    return `

        <article class="car-card">


            <!-- CAR IMAGE -->

            <div class="car-image">

                ${
                    image

                        ? `

                            <img
                                src="${image}"
                                alt="${car.brand} ${car.model}"
                                loading="${
                                    index === 0
                                        ? "eager"
                                        : "lazy"
                                }"
                            >

                        `

                        : `

                            <div class="car-image-placeholder">
                                No Image
                            </div>

                        `
                }


                ${recentBadge}

            </div>


            <!-- CAR INFORMATION -->

            <div class="car-info">


                <p class="car-brand">
                    ${car.brand}
                </p>


                <h3 class="car-title">
                    ${car.model}
                </h3>


                <!-- SPECIFICATIONS -->

                <div class="car-specs">

                    <span>
                        ${car.year}
                    </span>

                    <span>
                        ${car.fuel}
                    </span>

                    <span>
                        ${car.transmission}
                    </span>

                    <span>
                        ${car.km}
                    </span>

                </div>


                <!-- PRICE + DETAILS -->

                <div class="car-bottom">

                    <span class="price">
                        ${getPriceText(car)}
                    </span>


                    <a
                        class="view-btn"
                        href="car.html?id=${encodeURIComponent(car.id)}"
                    >
                        View Details →
                    </a>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   11. DISPLAY ALL CARS
   ========================================================= */

function displayCars() {

    const carList =
        document.getElementById("carList");


    /* Not homepage */

    if (!carList) {
        return;
    }


    const availableCars =
        getSortedCars();


    /* No cars */

    if (availableCars.length === 0) {

        carList.innerHTML = `

            <div class="empty-state">

                <h3>
                    No cars available right now
                </h3>

                <p>
                    New cars will appear here
                    when Hanuman Cars adds them.
                </p>

            </div>

        `;

        return;

    }


    /* Create cards */

    carList.innerHTML =
        availableCars
            .map(
                (car, index) =>
                    createCarCard(car, index)
            )
            .join("");

}


/* =========================================================
   12. GET CAR ID FROM URL
   ========================================================= */

function getCarFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const carId =
        params.get("id");


    if (!carId) {
        return null;
    }


    return cars.find(
        car =>
            String(car.id) ===
            String(carId)
    );

}


/* =========================================================
   13. CREATE SPECIFICATION
   ========================================================= */

function createSpecification(
    label,
    value
) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return "";

    }


    return `

        <div class="spec-item">

            <span>
                ${label}
            </span>

            <strong>
                ${value}
            </strong>

        </div>

    `;

}


/* =========================================================
   14. DISPLAY CAR DETAILS
   ========================================================= */

function displayCarDetails() {

    const details =
        document.getElementById(
            "carDetails"
        );


    /* Not car.html */

    if (!details) {
        return;
    }


    const car =
        getCarFromURL();


    /* Car doesn't exist */

    if (!car) {

        details.innerHTML = `

            <div class="not-found">

                <h2>
                    Car Not Found
                </h2>

                <p>
                    This car may no longer
                    be available.
                </p>

                <a
                    class="btn btn-primary"
                    href="index.html#cars"
                >
                    View Available Cars
                </a>

            </div>

        `;

        return;

    }


    /* Browser title */

    document.title =
        `${car.brand} ${car.model} | Hanuman Cars`;


    /* -------------------------
       SPECIFICATIONS
       ------------------------- */

    const specifications = [

        ["Year", car.year],

        ["Variant", car.variant],

        ["Fuel Type", car.fuel],

        ["Transmission", car.transmission],

        ["Kilometres", car.km],

        ["Number of Owners", car.owners],

        ["Registration", car.registration],

        ["Insurance", car.insurance],

        ["Location", car.location]

    ];


    /* -------------------------
       PHOTOS
       ------------------------- */

    const photos =
        car.photos &&
        car.photos.length
            ? car.photos
            : [];


    const mainPhoto =
        photos.length
            ? photos[0]
            : "";


    /* -------------------------
       BUILD PAGE
       ------------------------- */

    details.innerHTML = `

        <div class="details-layout">


            <!-- =================================
                 PHOTO GALLERY
                 ================================= -->

            <div class="car-gallery">


                <div class="gallery-main">

                    ${
                        mainPhoto

                            ? `

                                <img
                                    id="mainCarImage"
                                    src="${mainPhoto}"
                                    alt="${car.brand} ${car.model}"
                                >

                            `

                            : `

                                <div class="car-image-placeholder">
                                    No Image
                                </div>

                            `
                    }

                </div>


                <!-- THUMBNAILS -->

                <div
                    class="gallery-thumbs"
                    id="galleryThumbs"
                >

                    ${
                        photos
                            .map(
                                (photo, index) => `

                                    <button
                                        class="thumb ${
                                            index === 0
                                                ? "active"
                                                : ""
                                        }"
                                        data-photo="${photo}"
                                        aria-label="Show photo ${
                                            index + 1
                                        }"
                                        type="button"
                                    >

                                        <img
                                            src="${photo}"
                                            alt=""
                                        >

                                    </button>

                                `
                            )
                            .join("")
                    }

                </div>

            </div>


            <!-- =================================
                 CAR INFORMATION
                 ================================= -->

            <div class="details-info">


                <p class="car-brand">
                    ${car.brand}
                </p>


                <h1>
                    ${car.model}
                </h1>


                ${
                    car.variant
                        ? `
                            <p class="car-variant">
                                ${car.variant}
                            </p>
                          `
                        : ""
                }


                <!-- PRICE -->

                <div class="details-price">

                    <strong>
                        ${getPriceText(car)}
                    </strong>

                </div>


                <!-- SPECIFICATIONS -->

                <div class="spec-table">

                    ${
                        specifications
                            .map(
                                specification =>
                                    createSpecification(
                                        specification[0],
                                        specification[1]
                                    )
                            )
                            .join("")
                    }

                </div>


                <!-- DESCRIPTION -->

                <p class="details-description">
                    ${car.description}
                </p>


                <!-- ACTIONS -->

                <div class="details-actions">


                    <!-- WHATSAPP -->

                    <a
                        class="btn btn-dark"
                        target="_blank"
                        rel="noopener"
                        href="${createWhatsAppLink(
                            `Hi Hanuman Cars, I am interested in the ${car.brand} ${car.model} (${car.year}). Please share more details.`
                        )}"
                    >
                        Enquire on WhatsApp
                    </a>


                    <!-- SHARE -->

                    <button
                        class="share-btn"
                        id="shareCar"
                        type="button"
                    >
                        📤 Share This Car
                    </button>


                </div>

            </div>

        </div>

    `;


    /* Setup gallery */

    setupGallery(photos);


    /* Setup sharing */

    setupShareButton(car);

}


/* =========================================================
   15. PHOTO GALLERY
   ========================================================= */

function setupGallery(photos) {

    const mainImage =
        document.getElementById(
            "mainCarImage"
        );


    const thumbnails =
        document.querySelectorAll(
            ".thumb"
        );


    if (!mainImage) {
        return;
    }


    thumbnails.forEach(
        thumbnail => {

            thumbnail.addEventListener(
                "click",
                function () {

                    mainImage.src =
                        this.dataset.photo;


                    thumbnails.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    this.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


/* =========================================================
   16. SHARE CAR
   ========================================================= */

function setupShareButton(car) {

    const shareButton =
        document.getElementById(
            "shareCar"
        );


    if (!shareButton) {
        return;
    }


    shareButton.addEventListener(
        "click",
        async function () {

            const shareUrl =
                window.location.href;


            const shareData = {

                title:
                    `${car.brand} ${car.model} | Hanuman Cars`,

                text:
                    `Check out this ${car.brand} ${car.model} at Hanuman Cars.`,

                url:
                    shareUrl

            };


            /* Native sharing */

            if (
                window.isSecureContext &&
                navigator.share
            ) {

                try {

                    await navigator.share(
                        shareData
                    );

                    return;

                }

                catch (error) {

                    if (
                        error.name ===
                        "AbortError"
                    ) {
                        return;
                    }

                    console.log(
                        "Native share unavailable:",
                        error
                    );

                }

            }


            /* Clipboard fallback */

            try {

                await navigator.clipboard.writeText(
                    shareUrl
                );


                shareButton.textContent =
                    "✓ Link Copied!";


                setTimeout(
                    () => {

                        shareButton.textContent =
                            "📤 Share This Car";

                    },
                    2000
                );

            }

            catch (error) {

                window.prompt(
                    "Copy this car link:",
                    shareUrl
                );

            }

        }
    );

}


/* =========================================================
   17. MOBILE MENU
   ========================================================= */

function setupMobileMenu() {

    const menuButton =
        document.getElementById(
            "menuToggle"
        );


    const navigation =
        document.getElementById(
            "siteNav"
        );


    if (
        !menuButton ||
        !navigation
    ) {

        return;

    }


    menuButton.addEventListener(
        "click",
        function () {

            const isOpen =
                navigation.classList.toggle(
                    "open"
                );


            menuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );


            menuButton.textContent =
                isOpen
                    ? "✕"
                    : "☰";

        }
    );


    navigation
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    function () {

                        navigation.classList.remove(
                            "open"
                        );


                        menuButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );


                        menuButton.textContent =
                            "☰";

                    }
                );

            }
        );

}


/* =========================================================
   18. MAIN WHATSAPP BUTTON
   ========================================================= */

function setupBusinessContact() {

    const whatsappButton =
        document.getElementById(
            "mainWhatsapp"
        );


    if (!whatsappButton) {
        return;
    }


    const message =
        "Hi Hanuman Cars, I would like to know about the available used cars.";


    whatsappButton.href =
        createWhatsAppLink(
            message
        );

}


/* =========================================================
   19. CURRENT YEAR
   ========================================================= */

function setupYear() {

    const yearElement =
        document.getElementById(
            "year"
        );


    if (!yearElement) {
        return;
    }


    yearElement.textContent =
        new Date().getFullYear();

}


/* =========================================================
   20. INITIALIZE WEBSITE
   ========================================================= */

function initializeWebsite() {

    setupMobileMenu();

    setupBusinessContact();

    setupYear();

    loadCars();

}


/* =========================================================
   21. START WEBSITE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeWebsite
);
