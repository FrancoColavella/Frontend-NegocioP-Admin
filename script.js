document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // CONFIGURACIÓN
    // ==========================================

    const API_URL = CONFIG.API_URL;


    // ==========================================
    // ESTADO
    // ==========================================

    let productos = [];
    let categorias = [];
    let talles = [];
    let colores = [];
    let variantes = [];

    let productoEditando = null;


    // ==========================================
    // ELEMENTOS
    // ==========================================

    const navItems =
        document.querySelectorAll(".nav-item");

    const sections =
        document.querySelectorAll(".page-section");

    const pageTitle =
        document.getElementById("pageTitle");

    const sidebar =
        document.getElementById("sidebar");

    const mobileMenu =
        document.getElementById("mobileMenu");

    const refreshButton =
        document.getElementById("refreshButton");

    const connectionDot =
        document.getElementById("connectionDot");

    const connectionText =
        document.getElementById("connectionText");

    const dashboardConnection =
        document.getElementById("dashboardConnection");


    // ==========================================
    // NAVEGACIÓN
    // ==========================================

    const sectionNames = {

        dashboard: "Dashboard",

        productos: "Productos",

        categorias: "Categorías",

        talles: "Talles",

        colores: "Colores",

        pedidos: "Pedidos",

        stock: "Stock"

    };


    function cambiarSeccion(sectionName) {

        navItems.forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.section === sectionName
            );

        });


        sections.forEach(section => {

            section.classList.toggle(
                "active",
                section.id === `section-${sectionName}`
            );

        });


        pageTitle.textContent =
            sectionNames[sectionName] || "Dashboard";


        sidebar.classList.remove("mobile-open");


        if (sectionName === "productos") {
            renderProductos();
        }

        if (sectionName === "categorias") {
            renderCategorias();
        }

        if (sectionName === "talles") {
            renderTalles();
        }

        if (sectionName === "colores") {
            renderColores();
        }
    }


    navItems.forEach(item => {

        item.addEventListener("click", () => {

            cambiarSeccion(
                item.dataset.section
            );

        });

    });


    document
        .querySelectorAll("[data-section-target]")
        .forEach(button => {

            button.addEventListener("click", () => {

                cambiarSeccion(
                    button.dataset.sectionTarget
                );

            });

        });


    mobileMenu.addEventListener("click", () => {

        sidebar.classList.toggle("mobile-open");

    });


    // ==========================================
    // API HELPER
    // ==========================================

    async function apiFetch(
        endpoint,
        options = {}
    ) {

        const response = await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,

                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                }
            }
        );


        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }


        if (!response.ok) {

            const message =
                data?.error ||
                `Error HTTP ${response.status}`;

            throw new Error(message);
        }


        return data;
    }


    // ==========================================
    // CONEXIÓN
    // ==========================================

    async function comprobarConexion() {

        try {

            await apiFetch(
                CONFIG.ENDPOINTS.productos
            );


            connectionDot.classList.remove("offline");

            connectionDot.classList.add("online");

            connectionText.textContent =
                "API conectada";

            dashboardConnection.textContent =
                "Backend conectado";

        } catch (error) {

            connectionDot.classList.remove("online");

            connectionDot.classList.add("offline");

            connectionText.textContent =
                "API desconectada";

            dashboardConnection.textContent =
                "Backend no disponible";

            console.error(
                "Error de conexión:",
                error
            );
        }
    }


    // ==========================================
    // CARGAR PRODUCTOS
    // ==========================================

    async function cargarProductos() {

        try {

            productos = await apiFetch(
                CONFIG.ENDPOINTS.productos
            );

            renderProductos();

            renderDashboardProducts();

            actualizarEstadisticas();

        } catch (error) {

            console.error(error);

            mostrarErrorTabla(
                "No se pudieron cargar los productos."
            );
        }
    }


    // ==========================================
    // CARGAR CATEGORÍAS
    // ==========================================

    async function cargarCategorias() {

        try {

            categorias = await apiFetch(
                CONFIG.ENDPOINTS.categorias
            );

            renderCategorias();

            cargarCategoriasSelect();

            actualizarEstadisticas();

        } catch (error) {

            console.error(error);

            document.getElementById(
                "categoriesGrid"
            ).innerHTML = `
                <div class="loading">
                    No se pudieron cargar las categorías.
                </div>
            `;
        }
    }


    // ==========================================
    // CARGAR TALLES
    // ==========================================

    async function cargarTalles() {

        try {

            talles = await apiFetch(
                CONFIG.ENDPOINTS.talles
            );

            renderTalles();

            actualizarEstadisticas();

        } catch (error) {

            console.error(error);

            document.getElementById(
                "sizesGrid"
            ).innerHTML = `
                <div class="loading">
                    No se pudieron cargar los talles.
                </div>
            `;
        }
    }


    // ==========================================
    // CARGAR COLORES
    // ==========================================

    async function cargarColores() {

        try {

            colores = await apiFetch(
                CONFIG.ENDPOINTS.colores
            );

            renderColores();

            actualizarEstadisticas();

        } catch (error) {

            console.error(error);

            document.getElementById(
                "colorsGrid"
            ).innerHTML = `
                <div class="loading">
                    No se pudieron cargar los colores.
                </div>
            `;
        }
    }


    // ==========================================
    // RENDER PRODUCTOS
    // ==========================================

    function renderProductos(
        lista = productos
    ) {

        const tbody =
            document.getElementById(
                "productsTableBody"
            );


        if (!lista.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="loading">
                            No hay productos para mostrar.
                        </div>
                    </td>
                </tr>
            `;

            return;
        }


        tbody.innerHTML =
            lista.map(producto => {

                const categoria =
                    producto.categoria?.nombre ||
                    "Sin categoría";


                const precio =
                    formatearPrecio(
                        producto.precio
                    );


                const estadoClass =
                    producto.disponible
                        ? "status-active"
                        : "status-inactive";


                const estadoText =
                    producto.disponible
                        ? "Disponible"
                        : "No disponible";


                const visibleText =
                    producto.visible
                        ? "Visible"
                        : "Oculto";


                return `
                    <tr>

                        <td>

                            <div class="product-cell">

                                <div class="product-cell-image">
                                    ${obtenerInicial(producto.nombre)}
                                </div>

                                <div>

                                    <strong>
                                        ${escapeHtml(producto.nombre)}
                                    </strong>

                                    <span>
                                        ID #${producto.id}
                                    </span>

                                </div>

                            </div>

                        </td>


                        <td>

                            <span class="category-badge">
                                ${escapeHtml(categoria)}
                            </span>

                        </td>


                        <td class="price-cell">
                            ${precio}
                        </td>


                        <td>

                            <span class="status-badge ${estadoClass}">
                                ${estadoText}
                            </span>

                        </td>


                        <td class="visibility">
                            ${visibleText}
                        </td>


                        <td>

                            <div class="action-buttons">

                                <button
                                    class="icon-button"
                                    onclick="editarProducto(${producto.id})"
                                    title="Editar"
                                >
                                    ✎
                                </button>

                                <button
                                    class="icon-button delete"
                                    onclick="eliminarProducto(${producto.id})"
                                    title="Eliminar"
                                >
                                    ×
                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            }).join("");
    }


    // ==========================================
    // DASHBOARD PRODUCTOS
    // ==========================================

    function renderDashboardProducts() {

        const container =
            document.getElementById(
                "dashboardProducts"
            );


        if (!productos.length) {

            container.innerHTML = `
                <div class="loading">
                    No hay productos.
                </div>
            `;

            return;
        }


        const recientes =
            productos.slice(0, 5);


        container.innerHTML =
            recientes.map(producto => {

                return `
                    <div class="mini-product">

                        <div class="mini-product-info">

                            <div class="mini-product-image">
                                ${obtenerInicial(producto.nombre)}
                            </div>

                            <div>

                                <strong>
                                    ${escapeHtml(producto.nombre)}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        producto.categoria?.nombre ||
                                        "Sin categoría"
                                    )}
                                </span>

                            </div>

                        </div>

                        <div class="mini-product-price">
                            ${formatearPrecio(producto.precio)}
                        </div>

                    </div>
                `;

            }).join("");
    }


    // ==========================================
    // CATEGORÍAS
    // ==========================================

    function renderCategorias() {

        const container =
            document.getElementById(
                "categoriesGrid"
            );


        if (!categorias.length) {

            container.innerHTML = `
                <div class="loading">
                    No hay categorías.
                </div>
            `;

            return;
        }


        container.innerHTML =
            categorias.map(categoria => {

                const activa =
                    categoria.activa;


                return `
                    <div class="simple-card">

                        <div class="simple-card-header">

                            <div>

                                <span class="card-kicker">
                                    Categoría #${categoria.id}
                                </span>

                                <h3>
                                    ${escapeHtml(categoria.nombre)}
                                </h3>

                            </div>

                            <span class="status-badge ${
                                activa
                                    ? "status-active"
                                    : "status-inactive"
                            }">
                                ${
                                    activa
                                        ? "Activa"
                                        : "Inactiva"
                                }
                            </span>

                        </div>

                        <p>
                            ${escapeHtml(
                                categoria.descripcion ||
                                "Sin descripción"
                            )}
                        </p>

                    </div>
                `;

            }).join("");
    }


    // ==========================================
    // TALLES
    // ==========================================

    function renderTalles() {

        const container =
            document.getElementById(
                "sizesGrid"
            );


        if (!talles.length) {

            container.innerHTML = `
                <div class="loading">
                    No hay talles.
                </div>
            `;

            return;
        }


        container.innerHTML =
            talles.map(talle => {

                return `
                    <div class="simple-card">

                        <div class="simple-card-header">

                            <div class="size-display">
                                ${escapeHtml(talle.nombre)}
                            </div>

                            <span class="status-badge ${
                                talle.activo
                                    ? "status-active"
                                    : "status-inactive"
                            }">
                                ${
                                    talle.activo
                                        ? "Activo"
                                        : "Inactivo"
                                }
                            </span>

                        </div>

                        <p>
                            Talle #${talle.id}
                        </p>

                    </div>
                `;

            }).join("");
    }


    // ==========================================
    // COLORES
    // ==========================================

    function renderColores() {

        const container =
            document.getElementById(
                "colorsGrid"
            );


        if (!colores.length) {

            container.innerHTML = `
                <div class="loading">
                    No hay colores.
                </div>
            `;

            return;
        }


        container.innerHTML =
            colores.map(color => {

                return `
                    <div class="simple-card">

                        <div class="simple-card-header">

                            <div
                                class="color-preview"
                                style="background:${escapeHtml(
                                    color.codigoHex
                                )}"
                            ></div>

                            <span class="status-badge ${
                                color.activo
                                    ? "status-active"
                                    : "status-inactive"
                            }">
                                ${
                                    color.activo
                                        ? "Activo"
                                        : "Inactivo"
                                }
                            </span>

                        </div>

                        <h3>
                            ${escapeHtml(color.nombre)}
                        </h3>

                        <div class="color-code">
                            ${escapeHtml(color.codigoHex)}
                        </div>

                    </div>
                `;

            }).join("");
    }


    // ==========================================
    // ESTADÍSTICAS
    // ==========================================

    function actualizarEstadisticas() {

        document.getElementById(
            "statProductos"
        ).textContent =
            productos.length;


        document.getElementById(
            "statCategorias"
        ).textContent =
            categorias.length;


        document.getElementById(
            "statTalles"
        ).textContent =
            talles.filter(
                talle => talle.activo
            ).length;


        document.getElementById(
            "statColores"
        ).textContent =
            colores.filter(
                color => color.activo
            ).length;


        // Por ahora pedidos será conectado
        // cuando terminemos el endpoint GET.

        document.getElementById(
            "statPedidos"
        ).textContent = "—";
    }


    // ==========================================
    // SELECT CATEGORÍAS
    // ==========================================

    function cargarCategoriasSelect(
        categoriaSeleccionada = null
    ) {

        const select =
            document.getElementById(
                "productCategory"
            );


        const categoriasActivas =
            categorias.filter(
                categoria => categoria.activa
            );


        select.innerHTML = `
            <option value="">
                Seleccionar categoría
            </option>

            ${
                categoriasActivas.map(categoria => `
                    <option
                        value="${categoria.id}"
                        ${
                            Number(categoria.id) ===
                            Number(categoriaSeleccionada)
                                ? "selected"
                                : ""
                        }
                    >
                        ${escapeHtml(categoria.nombre)}
                    </option>
                `).join("")
            }
        `;
    }


    // ==========================================
    // MODAL PRODUCTO
    // ==========================================

    const productModal =
        document.getElementById(
            "productModal"
        );


    const productForm =
        document.getElementById(
            "productForm"
        );


    function abrirModalProducto(
        producto = null
    ) {

        productoEditando = producto;


        document.getElementById(
            "productFormError"
        ).classList.remove("active");


        if (producto) {

            document.getElementById(
                "modalTitle"
            ).textContent =
                "Editar producto";


            document.getElementById(
                "productId"
            ).value =
                producto.id;


            document.getElementById(
                "productName"
            ).value =
                producto.nombre || "";


            document.getElementById(
                "productPrice"
            ).value =
                producto.precio || "";


            document.getElementById(
                "productDescription"
            ).value =
                producto.descripcion || "";


            document.getElementById(
                "productAvailable"
            ).checked =
                producto.disponible;


            document.getElementById(
                "productVisible"
            ).checked =
                producto.visible;


            cargarCategoriasSelect(
                producto.categoria?.id
            );

            cargarTallesVariantSelect();
            cargarColoresVariantSelect();

            cargarVariantesProducto(
                producto.id
            );

        } else {

            document.getElementById(
                "modalTitle"
            ).textContent =
                "Nuevo producto";


            productForm.reset();


            document.getElementById(
                "productAvailable"
            ).checked = true;


            document.getElementById(
                "productVisible"
            ).checked = true;


            cargarCategoriasSelect();

            cargarTallesVariantSelect();
            cargarColoresVariantSelect();

            document.getElementById(
                "variantsList"
            ).innerHTML = `
                <div class="variants-empty">
                    Guardá primero el producto para poder agregar variantes.
                </div>
            `;

        }


        productModal.classList.add("active");

    }


    function cerrarModalProducto() {

        productModal.classList.remove("active");

        productoEditando = null;

    }

    // ==========================================
    // VARIANTES
    // ==========================================

    async function cargarVariantes() {

        try {

            variantes = await apiFetch(
                CONFIG.ENDPOINTS.variantes
            );

            return variantes;

        } catch (error) {

            console.error(
                "Error cargando variantes:",
                error
            );

            throw error;
        }
    }


    function cargarTallesVariantSelect() {

        const select =
            document.getElementById("variantTalle");

        if (!select) {
            return;
        }

        const tallesActivos =
            talles.filter(
                talle => talle.activo
            );

        select.innerHTML = `
            <option value="">
                Seleccionar talle
            </option>

            ${tallesActivos.map(talle => `
                <option value="${talle.id}">
                    ${escapeHtml(talle.nombre)}
                </option>
            `).join("")}
        `;
    }


    function cargarColoresVariantSelect() {

        const select =
            document.getElementById("variantColor");

        if (!select) {
            return;
        }

        const coloresActivos =
            colores.filter(
                color => color.activo
            );

        select.innerHTML = `
            <option value="">
                Seleccionar color
            </option>

            ${coloresActivos.map(color => `
                <option value="${color.id}">
                    ${escapeHtml(color.nombre)}
                </option>
            `).join("")}
        `;
    }


    async function cargarVariantesProducto(
        productoId
    ) {

        const container =
            document.getElementById("variantsList");

        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="loading">
                Cargando variantes...
            </div>
        `;

        try {

            const todas =
                await apiFetch(
                    CONFIG.ENDPOINTS.variantes
                );

            variantes = todas;

            const delProducto =
                todas.filter(
                    variante =>
                        Number(variante.producto?.id) ===
                        Number(productoId)
                );

            renderVariantesProducto(
                delProducto
            );

        } catch (error) {

            console.error(error);

            container.innerHTML = `
                <div class="variants-empty">
                    No se pudieron cargar las variantes.
                </div>
            `;
        }
    }


    function renderVariantesProducto(
        lista
    ) {

        const container =
            document.getElementById(
                "variantsList"
            );

        if (!container) {
            return;
        }

        if (!lista.length) {

            container.innerHTML = `
                <div class="variants-empty">
                    Este producto todavía no tiene variantes.
                </div>
            `;

            return;
        }


        container.innerHTML =
            lista.map(variante => {

                const talle =
                    variante.talle?.nombre ||
                    "Sin talle";

                const color =
                    variante.color?.nombre ||
                    "Sin color";

                const codigo =
                    variante.color?.codigoHex ||
                    "#cccccc";

                const stock =
                    Number(variante.stock) || 0;


                return `
                    <div
                        class="variant-row"
                        data-variant-id="${variante.id}"
                    >

                        <div class="variant-info">

                            <span class="variant-label">
                                Talle
                            </span>

                            <span class="variant-value">
                                ${escapeHtml(talle)}
                            </span>

                        </div>


                        <div class="variant-color">

                            <span
                                class="variant-color-preview"
                                style="background-color: ${escapeHtml(codigo)}"
                            ></span>

                            <span class="variant-value">
                                ${escapeHtml(color)}
                            </span>

                        </div>


                        <input
                            type="number"
                            class="variant-stock-input"
                            min="0"
                            step="1"
                            value="${stock}"
                            data-stock-input="${variante.id}"
                        >


                        <div class="variant-actions">

                            <button
                                type="button"
                                class="variant-save-button"
                                onclick="guardarStockVariante(${variante.id})"
                                title="Guardar stock"
                            >
                                ✓
                            </button>

                            <button
                                type="button"
                                class="variant-delete-button"
                                onclick="eliminarVariante(${variante.id})"
                                title="Eliminar variante"
                            >
                                🗑
                            </button>

                        </div>

                    </div>
                `;

            }).join("");
    }

    window.guardarStockVariante =
    async function(id) {

        const input =
            document.querySelector(
                `[data-stock-input="${id}"]`
            );

        if (!input) {
            return;
        }

        const stock =
            Number(input.value);


        if (
            !Number.isInteger(stock) ||
            stock < 0
        ) {

            mostrarToast(
                "El stock debe ser un número entero mayor o igual a 0."
            );

            return;
        }


        const variante =
            variantes.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (!variante) {

            mostrarToast(
                "No se encontró la variante."
            );

            return;
        }


        try {

            await apiFetch(
                `${CONFIG.ENDPOINTS.variantes}/${id}`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        producto: {
                            id: variante.producto.id
                        },

                        talle: {
                            id: variante.talle.id
                        },

                        color: {
                            id: variante.color.id
                        },

                        stock: stock
                    })
                }
            );


            mostrarToast(
                "Stock actualizado correctamente."
            );


            if (productoEditando) {

                await cargarVariantesProducto(
                    productoEditando.id
                );

            }

        } catch (error) {

            console.error(error);

            mostrarToast(
                error.message ||
                "No se pudo actualizar el stock."
            );
        }
    };

    document
    .getElementById("addVariantButton")
    .addEventListener(
        "click",
        async () => {

            const talleId =
                Number(
                    document.getElementById(
                        "variantTalle"
                    ).value
                );

            const colorId =
                Number(
                    document.getElementById(
                        "variantColor"
                    ).value
                );

            const stock =
                Number(
                    document.getElementById(
                        "variantStock"
                    ).value
                );

            const errorElement =
                document.getElementById(
                    "variantFormError"
                );


            errorElement.classList.remove(
                "active"
            );


            if (!productoEditando) {

                errorElement.textContent =
                    "Primero guardá el producto.";

                errorElement.classList.add(
                    "active"
                );

                return;
            }


            if (!talleId) {

                errorElement.textContent =
                    "Seleccioná un talle.";

                errorElement.classList.add(
                    "active"
                );

                return;
            }


            if (!colorId) {

                errorElement.textContent =
                    "Seleccioná un color.";

                errorElement.classList.add(
                    "active"
                );

                return;
            }


            if (
                !Number.isInteger(stock) ||
                stock < 0
            ) {

                errorElement.textContent =
                    "El stock debe ser un número entero mayor o igual a 0.";

                errorElement.classList.add(
                    "active"
                );

                return;
            }


            const yaExiste =
                variantes.some(
                    variante =>
                        Number(variante.producto?.id) ===
                            Number(productoEditando.id) &&
                        Number(variante.talle?.id) ===
                            Number(talleId) &&
                        Number(variante.color?.id) ===
                            Number(colorId)
                );


            if (yaExiste) {

                errorElement.textContent =
                    "Esa combinación de talle y color ya existe.";

                errorElement.classList.add(
                    "active"
                );

                return;
            }


            const button =
                document.getElementById(
                    "addVariantButton"
                );

            const textoOriginal =
                button.textContent;

            button.disabled = true;
            button.textContent =
                "Agregando...";


            try {

                await apiFetch(
                    CONFIG.ENDPOINTS.variantes,
                    {
                        method: "POST",

                        body: JSON.stringify({

                            producto: {
                                id:
                                    productoEditando.id
                            },

                            talle: {
                                id: talleId
                            },

                            color: {
                                id: colorId
                            },

                            stock: stock

                        })
                    }
                );


                mostrarToast(
                    "Variante agregada correctamente."
                );


                document.getElementById(
                    "variantTalle"
                ).value = "";


                document.getElementById(
                    "variantColor"
                ).value = "";


                document.getElementById(
                    "variantStock"
                ).value = 0;


                await cargarVariantesProducto(
                    productoEditando.id
                );


            } catch (error) {

                console.error(error);

                errorElement.textContent =
                    error.message ||
                    "No se pudo crear la variante.";

                errorElement.classList.add(
                    "active"
                );

            } finally {

                button.disabled = false;
                button.textContent =
                    textoOriginal;
            }

        }
    );

    window.eliminarVariante =
    async function(id) {

        const confirmar =
            confirm(
                "¿Querés eliminar esta variante?"
            );

        if (!confirmar) {
            return;
        }


        try {

            await apiFetch(
                `${CONFIG.ENDPOINTS.variantes}/${id}`,
                {
                    method: "DELETE"
                }
            );


            mostrarToast(
                "Variante eliminada correctamente."
            );


            if (productoEditando) {

                await cargarVariantesProducto(
                    productoEditando.id
                );

            }

        } catch (error) {

            console.error(error);

            mostrarToast(
                error.message ||
                "No se pudo eliminar la variante."
            );
        }
    };


    document
        .getElementById("newProductButton")
        .addEventListener(
            "click",
            () => abrirModalProducto()
        );


    document
        .getElementById("closeProductModal")
        .addEventListener(
            "click",
            cerrarModalProducto
        );


    document
        .getElementById("cancelProduct")
        .addEventListener(
            "click",
            cerrarModalProducto
        );


    productModal.addEventListener(
        "click",
        event => {

            if (
                event.target === productModal
            ) {
                cerrarModalProducto();
            }

        }
    );


    // ==========================================
    // GUARDAR PRODUCTO
    // ==========================================

    productForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const nombre =
                document.getElementById(
                    "productName"
                ).value.trim();


            const precio =
                Number(
                    document.getElementById(
                        "productPrice"
                    ).value
                );


            const descripcion =
                document.getElementById(
                    "productDescription"
                ).value.trim();


            const categoriaId =
                Number(
                    document.getElementById(
                        "productCategory"
                    ).value
                );


            const disponible =
                document.getElementById(
                    "productAvailable"
                ).checked;


            const visible =
                document.getElementById(
                    "productVisible"
                ).checked;


            const errorElement =
                document.getElementById(
                    "productFormError"
                );


            errorElement.classList.remove(
                "active"
            );


            if (!nombre) {

                mostrarErrorFormulario(
                    "El nombre del producto es obligatorio."
                );

                return;
            }


            if (
                Number.isNaN(precio) ||
                precio < 0
            ) {

                mostrarErrorFormulario(
                    "El precio no es válido."
                );

                return;
            }


            if (!categoriaId) {

                mostrarErrorFormulario(
                    "Seleccioná una categoría."
                );

                return;
            }


            const productoData = {

                nombre,

                descripcion,

                precio,

                visible,

                disponible,

                categoria: {
                    id: categoriaId
                }

            };


            const button =
                document.getElementById(
                    "saveProductButton"
                );


            const textoOriginal =
                button.textContent;


            button.disabled = true;

            button.textContent =
                "Guardando...";


            try {

                let resultado;


                if (productoEditando) {

                    resultado =
                        await apiFetch(
                            `${CONFIG.ENDPOINTS.productos}/${productoEditando.id}`,
                            {
                                method: "PUT",

                                body: JSON.stringify(
                                    productoData
                                )
                            }
                        );

                    mostrarToast(
                        "Producto actualizado correctamente."
                    );

                } else {

                    resultado =
                        await apiFetch(
                            CONFIG.ENDPOINTS.productos,
                            {
                                method: "POST",

                                body: JSON.stringify(
                                    productoData
                                )
                            }
                        );

                    mostrarToast(
                        "Producto creado correctamente."
                    );
                }


                cerrarModalProducto();

                await cargarProductos();

            } catch (error) {

                console.error(error);

                mostrarErrorFormulario(
                    error.message
                );

            } finally {

                button.disabled = false;

                button.textContent =
                    textoOriginal;
            }

        }
    );


    // ==========================================
    // EDITAR PRODUCTO
    // ==========================================

    window.editarProducto =
        function(id) {

            const producto =
                productos.find(
                    item =>
                        Number(item.id) ===
                        Number(id)
                );


            if (!producto) {

                mostrarToast(
                    "No se encontró el producto."
                );

                return;
            }


            abrirModalProducto(producto);
        };


    // ==========================================
    // ELIMINAR PRODUCTO
    // ==========================================

    window.eliminarProducto =
        async function(id) {

            const producto =
                productos.find(
                    item =>
                        Number(item.id) ===
                        Number(id)
                );


            if (!producto) {
                return;
            }


            const confirmar =
                confirm(
                    `¿Querés eliminar "${producto.nombre}"?`
                );


            if (!confirmar) {
                return;
            }


            try {

                await apiFetch(
                    `${CONFIG.ENDPOINTS.productos}/${id}`,
                    {
                        method: "DELETE"
                    }
                );


                mostrarToast(
                    "Producto eliminado correctamente."
                );


                await cargarProductos();

            } catch (error) {

                console.error(error);

                mostrarToast(
                    error.message
                );
            }
        };


    // ==========================================
    // BUSCADOR
    // ==========================================

    document
        .getElementById("productSearch")
        .addEventListener(
            "input",
            event => {

                const texto =
                    event.target.value
                        .trim()
                        .toLowerCase();


                if (!texto) {

                    renderProductos();

                    return;
                }


                const filtrados =
                    productos.filter(
                        producto => {

                            const nombre =
                                producto.nombre
                                    ?.toLowerCase() ||
                                "";


                            const descripcion =
                                producto.descripcion
                                    ?.toLowerCase() ||
                                "";


                            const categoria =
                                producto.categoria
                                    ?.nombre
                                    ?.toLowerCase() ||
                                "";


                            return (
                                nombre.includes(texto) ||
                                descripcion.includes(texto) ||
                                categoria.includes(texto)
                            );

                        }
                    );


                renderProductos(filtrados);
            }
        );


    // ==========================================
    // RECARGAR
    // ==========================================

    refreshButton.addEventListener(
        "click",
        async () => {

            refreshButton.style.transform =
                "rotate(360deg)";

            setTimeout(() => {

                refreshButton.style.transform =
                    "";

            }, 500);


            await cargarTodo();

            mostrarToast(
                "Información actualizada."
            );
        }
    );


    document
        .getElementById("reloadProducts")
        .addEventListener(
            "click",
            cargarProductos
        );


    // ==========================================
    // HELPERS
    // ==========================================

    function formatearPrecio(valor) {

        return new Intl.NumberFormat(
            "es-AR",
            {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 2
            }
        ).format(
            Number(valor || 0)
        );
    }


    function obtenerInicial(nombre) {

        if (!nombre) {
            return "N";
        }

        return nombre
            .trim()
            .charAt(0)
            .toUpperCase();
    }


    function escapeHtml(value) {

        if (value === null ||
            value === undefined) {

            return "";
        }


        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function mostrarErrorFormulario(
        mensaje
    ) {

        const errorElement =
            document.getElementById(
                "productFormError"
            );


        errorElement.textContent =
            mensaje;


        errorElement.classList.add(
            "active"
        );
    }


    function mostrarErrorTabla(
        mensaje
    ) {

        document.getElementById(
            "productsTableBody"
        ).innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="loading">
                        ${escapeHtml(mensaje)}
                    </div>
                </td>
            </tr>
        `;
    }


    let toastTimeout;


    function mostrarToast(
        mensaje
    ) {

        const toast =
            document.getElementById(
                "toast"
            );


        document.getElementById(
            "toastMessage"
        ).textContent =
            mensaje;


        toast.classList.add(
            "show"
        );


        clearTimeout(toastTimeout);


        toastTimeout =
            setTimeout(() => {

                toast.classList.remove(
                    "show"
                );

            }, 3000);
    }


    // ==========================================
    // CARGAR TODO
    // ==========================================

    async function cargarTodo() {

        await Promise.all([
            cargarProductos(),
            cargarCategorias(),
            cargarTalles(),
            cargarColores(),
            comprobarConexion()
        ]);
    }


    // ==========================================
    // INICIALIZACIÓN
    // ==========================================

    cargarTodo();

});