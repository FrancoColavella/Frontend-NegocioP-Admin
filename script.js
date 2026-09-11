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

    let pedidos = [];

    let pedidoEditando = null;

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

        stock: "Stock",

        movimientos: "Movimientos de stock"

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

        if (sectionName === "stock") {
            cargarStock();
        }

        if (sectionName === "pedidos") {
            cargarPedidos();
        }

        if (sectionName === "movimientos") {
            cargarMovimientos();
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
    // PEDIDOS
    // ==========================================

    async function cargarPedidos() {

        const tbody =
            document.getElementById(
                "ordersTableBody"
            );

        if (!tbody) {
            return;
        }


        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="loading">
                        Cargando pedidos...
                    </div>
                </td>
            </tr>
        `;


        try {

            pedidos =
                await apiFetch(
                    CONFIG.ENDPOINTS.pedidos
                );


            renderPedidos();

            actualizarEstadisticasPedidos();


        } catch (error) {

            console.error(
                "Error cargando pedidos:",
                error
            );


            tbody.innerHTML = `
                <tr>
                    <td colspan="6">

                        <div class="loading">
                            No se pudieron cargar los pedidos.
                        </div>

                    </td>
                </tr>
            `;

        }

    }


    // ==========================================
    // RENDER PEDIDOS
    // ==========================================

    function renderPedidos() {

        const tbody =
            document.getElementById(
                "ordersTableBody"
            );


        if (!tbody) {
            return;
        }


        const busqueda =
            document
                .getElementById("orderSearch")
                ?.value
                ?.trim()
                .toLowerCase() || "";


        const estado =
            document
                .getElementById("orderStatusFilter")
                ?.value || "";


        let lista =
            [...pedidos];


        // BÚSQUEDA

        if (busqueda) {

            lista =
                lista.filter(
                    pedido => {

                        const id =
                            String(
                                pedido.id || ""
                            );


                        const nombre =
                            `${pedido.nombreCliente || ""}
                            ${pedido.apellidoCliente || ""}`
                                .toLowerCase();


                        const email =
                            (
                                pedido.emailCliente ||
                                ""
                            ).toLowerCase();


                        return (
                            id.includes(busqueda) ||
                            nombre.includes(busqueda) ||
                            email.includes(busqueda)
                        );

                    }
                );

        }


        // FILTRO ESTADO

        if (estado) {

            lista =
                lista.filter(
                    pedido =>
                        pedido.estado === estado
                );

        }


        // ORDENAR MÁS RECIENTE PRIMERO

        lista.sort(
            (a, b) =>
                new Date(b.fecha) -
                new Date(a.fecha)
        );


        if (!lista.length) {

            tbody.innerHTML = `
                <tr>

                    <td colspan="6">

                        <div class="stock-empty-state">

                            <div>
                                🛒
                            </div>

                            <strong>
                                No hay pedidos
                            </strong>

                            <span>
                                No encontramos pedidos con los filtros seleccionados.
                            </span>

                        </div>

                    </td>

                </tr>
            `;

            return;
        }


        tbody.innerHTML =
            lista.map(
                pedido => {

                    const nombre =
                        `${pedido.nombreCliente || ""}
                        ${pedido.apellidoCliente || ""}`
                            .trim();


                    const estadoClase =
                        obtenerClaseEstadoPedido(
                            pedido.estado
                        );


                    return `
                        <tr>

                            <td>

                                <strong>
                                    #${pedido.id}
                                </strong>

                            </td>


                            <td>

                                <div class="order-client">

                                    <strong>
                                        ${escapeHtml(
                                            nombre
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHtml(
                                            pedido.emailCliente || ""
                                        )}
                                    </span>

                                </div>

                            </td>


                            <td>
                                ${formatearFechaPedido(
                                    pedido.fecha
                                )}
                            </td>


                            <td>

                                <strong>
                                    ${formatearPrecio(
                                        pedido.total
                                    )}
                                </strong>

                            </td>


                            <td>

                                <span
                                    class="order-status ${estadoClase}"
                                >
                                    ${escapeHtml(
                                        formatearEstadoPedido(
                                            pedido.estado
                                        )
                                    )}
                                </span>

                            </td>


                            <td>

                                <button
                                    type="button"
                                    class="icon-button"
                                    title="Ver pedido"
                                    onclick="verPedido(${pedido.id})"
                                >
                                    👁
                                </button>

                            </td>

                        </tr>
                    `;

                }
            ).join("");

    }


    // ==========================================
    // ESTADÍSTICAS
    // ==========================================

    function actualizarEstadisticasPedidos() {

        const total =
            pedidos.length;


        const pendientes =
            pedidos.filter(
                pedido =>
                    pedido.estado ===
                    "PENDIENTE"
            ).length;


        const confirmados =
            pedidos.filter(
                pedido =>
                    pedido.estado ===
                    "CONFIRMADO"
            ).length;


        const ventas =
            pedidos
                .filter(
                    pedido =>
                        pedido.estado !==
                        "CANCELADO"
                )
                .reduce(
                    (total, pedido) =>
                        total +
                        Number(
                            pedido.total || 0
                        ),
                    0
                );


        const totalElement =
            document.getElementById(
                "ordersTotal"
            );

        const pendingElement =
            document.getElementById(
                "ordersPending"
            );

        const confirmedElement =
            document.getElementById(
                "ordersConfirmed"
            );

        const salesElement =
            document.getElementById(
                "ordersSales"
            );


        if (totalElement) {
            totalElement.textContent =
                total;
        }


        if (pendingElement) {
            pendingElement.textContent =
                pendientes;
        }


        if (confirmedElement) {
            confirmedElement.textContent =
                confirmados;
        }


        if (salesElement) {
            salesElement.textContent =
                formatearPrecio(
                    ventas
                );
        }

    }


    // ==========================================
    // VER PEDIDO
    // ==========================================

    window.verPedido =
        async function(id) {

            const modal =
                document.getElementById(
                    "orderModal"
                );

            const content =
                document.getElementById(
                    "orderModalContent"
                );

            const title =
                document.getElementById(
                    "orderModalTitle"
                );


            if (!modal || !content) {
                return;
            }


            modal.classList.add("active");


            content.innerHTML = `
                <div class="loading">
                    Cargando pedido...
                </div>
            `;


            try {

                const pedido =
                    await apiFetch(
                        `${CONFIG.ENDPOINTS.pedidos}/${id}`
                    );


                title.textContent =
                    `Pedido #${pedido.id}`;


                content.innerHTML =
                    construirDetallePedido(
                        pedido
                    );


            } catch (error) {

                console.error(error);


                content.innerHTML = `
                    <div class="form-error active">
                        ${escapeHtml(
                            error.message ||
                            "No se pudo cargar el pedido."
                        )}
                    </div>
                `;

            }

        };


    // ==========================================
    // CONSTRUIR DETALLE
    // ==========================================

    function construirDetallePedido(
        pedido
    ) {

        const nombre =
            `${pedido.nombreCliente || ""}
            ${pedido.apellidoCliente || ""}`
                .trim();


        const detalles =
            pedido.detalles || [];


        return `

            <div class="order-detail">

                <div class="order-detail-grid">

                    <div>

                        <span>
                            Cliente
                        </span>

                        <strong>
                            ${escapeHtml(
                                nombre
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Fecha
                        </span>

                        <strong>
                            ${formatearFechaPedido(
                                pedido.fecha
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Email
                        </span>

                        <strong>
                            ${escapeHtml(
                                pedido.emailCliente
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Teléfono
                        </span>

                        <strong>
                            ${escapeHtml(
                                pedido.telefonoCliente
                            )}
                        </strong>

                    </div>


                    <div class="order-detail-full">

                        <span>
                            Dirección de entrega
                        </span>

                        <strong>
                            ${escapeHtml(
                                pedido.direccionEntrega
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                pedido.localidadEntrega
                            )}
                            · CP
                            ${escapeHtml(
                                pedido.codigoPostalEntrega
                            )}
                        </small>

                    </div>

                </div>


                <div class="order-status-editor">

                    <label>
                        Estado del pedido
                    </label>

                    <select
                        id="orderDetailStatus"
                        data-current-status="${escapeHtml(
                            pedido.estado
                        )}"
                    >

                        <option value="PENDIENTE">
                            Pendiente
                        </option>

                        <option value="CONFIRMADO">
                            Confirmado
                        </option>

                        <option value="PREPARANDO">
                            Preparando
                        </option>

                        <option value="ENVIADO">
                            Enviado
                        </option>

                        <option value="ENTREGADO">
                            Entregado
                        </option>

                        <option value="CANCELADO">
                            Cancelado
                        </option>

                    </select>


                    <button
                        type="button"
                        class="primary-button"
                        onclick="cambiarEstadoPedido(${pedido.id})"
                    >
                        Actualizar estado
                    </button>

                </div>


                <div class="order-products">

                    <h3>
                        Productos
                    </h3>


                    ${detalles.map(
                        detalle => {

                            const producto =
                                detalle.producto;


                            const variante =
                                detalle.variante;


                            return `

                                <div class="order-product">

                                    <div class="order-product-main">

                                        <strong>
                                            ${escapeHtml(
                                                producto?.nombre ||
                                                "Producto"
                                            )}
                                        </strong>

                                        <span>
                                            Cantidad:
                                            ${detalle.cantidad}
                                        </span>

                                    </div>


                                    <div class="order-product-variant">

                                        <span>
                                            Talle:
                                            <strong>
                                                ${escapeHtml(
                                                    variante?.talle?.nombre ||
                                                    "-"
                                                )}
                                            </strong>
                                        </span>


                                        <span>

                                            Color:

                                            <span class="order-color">

                                                <i
                                                    style="
                                                        background:${escapeHtml(
                                                            variante?.color?.codigoHex ||
                                                            "#ccc"
                                                        )}
                                                    "
                                                ></i>

                                                <strong>
                                                    ${escapeHtml(
                                                        variante?.color?.nombre ||
                                                        "-"
                                                    )}
                                                </strong>

                                            </span>

                                        </span>

                                    </div>


                                    <div class="order-product-price">

                                        <span>
                                            ${formatearPrecio(
                                                detalle.precioUnitario
                                            )}
                                        </span>

                                        <strong>
                                            ${formatearPrecio(
                                                detalle.subtotal
                                            )}
                                        </strong>

                                    </div>

                                </div>

                            `;

                        }
                    ).join("")}

                </div>


                <div class="order-totals">

                    <div>

                        <span>
                            Subtotal
                        </span>

                        <strong>
                            ${formatearPrecio(
                                pedido.subtotal
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Envío
                        </span>

                        <strong>
                            ${formatearPrecio(
                                pedido.costoEnvio
                            )}
                        </strong>

                    </div>


                    <div class="order-total-final">

                        <span>
                            Total
                        </span>

                        <strong>
                            ${formatearPrecio(
                                pedido.total
                            )}
                        </strong>

                    </div>

                </div>

            </div>

        `;
    }


    // ==========================================
    // CAMBIAR ESTADO
    // ==========================================

    window.cambiarEstadoPedido =
        async function(id) {

            const select =
                document.getElementById(
                    "orderDetailStatus"
                );


            if (!select) {
                return;
            }


            const estado =
                select.value;


            try {

                await apiFetch(
                    `${CONFIG.ENDPOINTS.pedidos}/${id}/estado`,
                    {
                        method: "PUT",

                        body: JSON.stringify({
                            estado: estado
                        })
                    }
                );


                mostrarToast(
                    "Estado actualizado correctamente."
                );


                await cargarPedidos();


                await verPedido(id);


            } catch (error) {

                console.error(error);


                mostrarToast(
                    error.message ||
                    "No se pudo actualizar el estado."
                );

            }

        };


    // ==========================================
    // HELPERS PEDIDOS
    // ==========================================

    function obtenerClaseEstadoPedido(
        estado
    ) {

        switch (estado) {

            case "PENDIENTE":
                return "order-status-pending";

            case "CONFIRMADO":
                return "order-status-confirmed";

            case "PREPARANDO":
                return "order-status-preparing";

            case "ENVIADO":
                return "order-status-shipped";

            case "ENTREGADO":
                return "order-status-delivered";

            case "CANCELADO":
                return "order-status-cancelled";

            default:
                return "";

        }

    }


    function formatearEstadoPedido(
        estado
    ) {

        const estados = {

            PENDIENTE: "Pendiente",

            CONFIRMADO: "Confirmado",

            PREPARANDO: "Preparando",

            ENVIADO: "Enviado",

            ENTREGADO: "Entregado",

            CANCELADO: "Cancelado"

        };


        return estados[estado] || estado;

    }


    function formatearFechaPedido(
        fecha
    ) {

        if (!fecha) {
            return "-";
        }


        const date =
            new Date(fecha);


        if (Number.isNaN(
            date.getTime()
        )) {

            return fecha;

        }


        return new Intl.DateTimeFormat(
            "es-AR",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        ).format(date);

    }


    // ==========================================
    // CERRAR MODAL PEDIDO
    // ==========================================

    document
        .getElementById(
            "closeOrderModal"
        )
        ?.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "orderModal"
                    )
                    ?.classList.remove(
                        "active"
                    );

            }
        );


    document
        .getElementById(
            "cancelOrderModal"
        )
        ?.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "orderModal"
                    )
                    ?.classList.remove(
                        "active"
                    );

            }
        );


    document
        .getElementById(
            "orderModal"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "orderModal"
                ) {

                    event.target
                        .classList.remove(
                            "active"
                        );

                }

            }
        );


    // ==========================================
    // EVENTOS PEDIDOS
    // ==========================================

    document
        .getElementById(
            "orderSearch"
        )
        ?.addEventListener(
            "input",
            renderPedidos
        );


    document
        .getElementById(
            "orderStatusFilter"
        )
        ?.addEventListener(
            "change",
            renderPedidos
        );


    document
        .getElementById(
            "reloadOrders"
        )
        ?.addEventListener(
            "click",
            cargarPedidos
        );



    // ==========================================
    // STOCK
    // ==========================================

    let stockVariantes = [];

    let filtrosStock = {
        busqueda: "",
        categoria: "",
        talle: "",
        color: "",
        estado: ""
    };


    // ==========================================
    // CARGAR STOCK
    // ==========================================

    async function cargarStock() {

        const tbody =
            document.getElementById(
                "stockTableBody"
            );

        if (!tbody) {
            return;
        }


        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="loading">
                        Cargando stock...
                    </div>
                </td>
            </tr>
        `;


        try {

            stockVariantes =
                await apiFetch(
                    CONFIG.ENDPOINTS.variantes
                );


            actualizarFiltrosStock();

            renderStock();

        } catch (error) {

            console.error(
                "Error cargando stock:",
                error
            );


            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="loading">
                            No se pudo cargar el stock.
                        </div>
                    </td>
                </tr>
            `;

        }

    }


    // ==========================================
    // FILTROS
    // ==========================================

    function actualizarFiltrosStock() {

        const categorySelect =
            document.getElementById(
                "stockCategoryFilter"
            );

        const sizeSelect =
            document.getElementById(
                "stockSizeFilter"
            );

        const colorSelect =
            document.getElementById(
                "stockColorFilter"
            );


        if (!categorySelect ||
            !sizeSelect ||
            !colorSelect) {

            return;
        }


        const categoriasStock =
            [
                ...new Map(
                    stockVariantes
                        .filter(v => v.producto?.categoria)
                        .map(v => [
                            v.producto.categoria.id,
                            v.producto.categoria
                        ])
                ).values()
            ];


        const tallesStock =
            [
                ...new Map(
                    stockVariantes
                        .filter(v => v.talle)
                        .map(v => [
                            v.talle.id,
                            v.talle
                        ])
                ).values()
            ];


        const coloresStock =
            [
                ...new Map(
                    stockVariantes
                        .filter(v => v.color)
                        .map(v => [
                            v.color.id,
                            v.color
                        ])
                ).values()
            ];


        categorySelect.innerHTML = `
            <option value="">
                Todas las categorías
            </option>

            ${categoriasStock.map(categoria => `
                <option value="${categoria.id}">
                    ${escapeHtml(categoria.nombre)}
                </option>
            `).join("")}
        `;


        sizeSelect.innerHTML = `
            <option value="">
                Todos los talles
            </option>

            ${tallesStock.map(talle => `
                <option value="${talle.id}">
                    ${escapeHtml(talle.nombre)}
                </option>
            `).join("")}
        `;


        colorSelect.innerHTML = `
            <option value="">
                Todos los colores
            </option>

            ${coloresStock.map(color => `
                <option value="${color.id}">
                    ${escapeHtml(color.nombre)}
                </option>
            `).join("")}
        `;

    }


    // ==========================================
    // ESTADO DEL STOCK
    // ==========================================

    function obtenerEstadoStock(stock) {

        stock = Number(stock);


        if (stock <= 0) {

            return {
                clase: "stock-status-empty",
                texto: "Sin stock"
            };

        }


        if (stock <= 5) {

            return {
                clase: "stock-status-low",
                texto: "Stock bajo"
            };

        }


        return {
            clase: "stock-status-ok",
            texto: "En stock"
        };

    }


    // ==========================================
    // RENDER STOCK
    // ==========================================

    function renderStock() {

        const tbody =
            document.getElementById(
                "stockTableBody"
            );


        if (!tbody) {
            return;
        }


        let lista =
            [...stockVariantes];


        // ================================
        // BÚSQUEDA
        // ================================

        if (filtrosStock.busqueda) {

            const texto =
                filtrosStock.busqueda
                    .toLowerCase()
                    .trim();


            lista =
                lista.filter(variante => {

                    const producto =
                        variante.producto?.nombre
                            ?.toLowerCase() || "";


                    const categoria =
                        variante.producto
                            ?.categoria
                            ?.nombre
                            ?.toLowerCase() || "";


                    const talle =
                        variante.talle
                            ?.nombre
                            ?.toLowerCase() || "";


                    const color =
                        variante.color
                            ?.nombre
                            ?.toLowerCase() || "";


                    return (
                        producto.includes(texto) ||
                        categoria.includes(texto) ||
                        talle.includes(texto) ||
                        color.includes(texto)
                    );

                });

        }


        // ================================
        // CATEGORÍA
        // ================================

        if (filtrosStock.categoria) {

            lista =
                lista.filter(
                    variante =>
                        String(
                            variante.producto
                                ?.categoria
                                ?.id
                        ) ===
                        String(
                            filtrosStock.categoria
                        )
                );

        }


        // ================================
        // TALLE
        // ================================

        if (filtrosStock.talle) {

            lista =
                lista.filter(
                    variante =>
                        String(
                            variante.talle?.id
                        ) ===
                        String(
                            filtrosStock.talle
                        )
                );

        }


        // ================================
        // COLOR
        // ================================

        if (filtrosStock.color) {

            lista =
                lista.filter(
                    variante =>
                        String(
                            variante.color?.id
                        ) ===
                        String(
                            filtrosStock.color
                        )
                );

        }


        // ================================
        // ESTADO
        // ================================

        if (filtrosStock.estado) {

            lista =
                lista.filter(variante => {

                    const stock =
                        Number(
                            variante.stock
                        );


                    if (
                        filtrosStock.estado ===
                        "empty"
                    ) {

                        return stock <= 0;

                    }


                    if (
                        filtrosStock.estado ===
                        "low"
                    ) {

                        return (
                            stock > 0 &&
                            stock <= 5
                        );

                    }


                    if (
                        filtrosStock.estado ===
                        "ok"
                    ) {

                        return stock > 5;

                    }


                    return true;

                });

        }


        actualizarEstadisticasStock();


        if (!lista.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7">

                        <div class="stock-empty-state">

                            <div>
                                📦
                            </div>

                            <strong>
                                No hay variantes
                            </strong>

                            <span>
                                No encontramos stock con los filtros seleccionados.
                            </span>

                        </div>

                    </td>
                </tr>
            `;

            return;
        }


        tbody.innerHTML =
            lista.map(variante => {

                const producto =
                    variante.producto?.nombre ||
                    "Sin producto";


                const categoria =
                    variante.producto
                        ?.categoria
                        ?.nombre ||
                    "Sin categoría";


                const talle =
                    variante.talle?.nombre ||
                    "-";


                const color =
                    variante.color?.nombre ||
                    "-";


                const codigoHex =
                    variante.color
                        ?.codigoHex ||
                    "#cccccc";


                const stock =
                    Number(
                        variante.stock
                    );


                const estado =
                    obtenerEstadoStock(
                        stock
                    );


                return `

                    <tr>

                        <td>

                            <div class="stock-product">

                                <strong>
                                    ${escapeHtml(
                                        producto
                                    )}
                                </strong>

                            </div>

                        </td>


                        <td>
                            ${escapeHtml(
                                categoria
                            )}
                        </td>


                        <td>

                            <span class="stock-size">
                                ${escapeHtml(
                                    talle
                                )}
                            </span>

                        </td>


                        <td>

                            <div class="stock-color">

                                <span
                                    class="stock-color-dot"
                                    style="
                                        background:${escapeHtml(
                                            codigoHex
                                        )}
                                    "
                                ></span>

                                ${escapeHtml(
                                    color
                                )}

                            </div>

                        </td>


                        <td>

                            <input
                                type="number"
                                min="0"
                                step="1"
                                class="stock-table-input"
                                value="${stock}"
                                data-stock-table-input="${variante.id}"
                            >

                        </td>


                        <td>

                            <span
                                class="stock-status ${estado.clase}"
                            >
                                ${estado.texto}
                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="icon-button"
                                title="Guardar stock"
                                onclick="guardarStockDesdeTabla(${variante.id})"
                            >
                                ✓
                            </button>

                        </td>

                    </tr>

                `;

            }).join("");

    }


    // ==========================================
    // ESTADÍSTICAS
    // ==========================================

    function actualizarEstadisticasStock() {

        const total =
            stockVariantes.length;


        const enStock =
            stockVariantes.filter(
                variante =>
                    Number(
                        variante.stock
                    ) > 5
            ).length;


        const bajo =
            stockVariantes.filter(
                variante => {

                    const stock =
                        Number(
                            variante.stock
                        );

                    return (
                        stock > 0 &&
                        stock <= 5
                    );

                }
            ).length;


        const sinStock =
            stockVariantes.filter(
                variante =>
                    Number(
                        variante.stock
                    ) <= 0
            ).length;


        document.getElementById(
            "stockTotalVariantes"
        ).textContent = total;


        document.getElementById(
            "stockEnStock"
        ).textContent = enStock;


        document.getElementById(
            "stockBajo"
        ).textContent = bajo;


        document.getElementById(
            "stockSinStock"
        ).textContent = sinStock;

    }


    // ==========================================
    // GUARDAR STOCK DESDE TABLA
    // ==========================================

    window.guardarStockDesdeTabla =
        async function(id) {

            const input =
                document.querySelector(
                    `[data-stock-table-input="${id}"]`
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
                stockVariantes.find(
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

            const stockAnterior =
                Number(variante.stock);

            // No hacemos ninguna petición si el stock no cambió.
            if (stockAnterior === stock) {

                mostrarToast(
                    "El stock no tuvo cambios."
                );

                return;
            }

            try {

                await apiFetch(
                    `${CONFIG.ENDPOINTS.variantes}/${id}/stock`,
                    {
                        method: "PUT",

                        body: JSON.stringify({
                            stock: stock
                        })
                    }
                );

                mostrarToast(
                    "Stock actualizado y movimiento registrado."
                );

                await cargarStock();

            } catch (error) {

                console.error(
                    "Error actualizando stock:",
                    error
                );

                mostrarToast(
                    error.message ||
                    "No se pudo actualizar el stock."
                );
            }
        };


    // ==========================================
    // EVENTOS FILTROS STOCK
    // ==========================================

    document
        .getElementById("stockSearch")
        ?.addEventListener(
            "input",
            event => {

                filtrosStock.busqueda =
                    event.target.value;

                renderStock();

            }
        );


    document
        .getElementById(
            "stockCategoryFilter"
        )
        ?.addEventListener(
            "change",
            event => {

                filtrosStock.categoria =
                    event.target.value;

                renderStock();

            }
        );


    document
        .getElementById(
            "stockSizeFilter"
        )
        .addEventListener(
            "change",
            event => {

                filtrosStock.talle =
                    event.target.value;

                renderStock();

            }
        );


    document
        .getElementById(
            "stockColorFilter"
        )
        ?.addEventListener(
            "change",
            event => {

                filtrosStock.color =
                    event.target.value;

                renderStock();

            }
        );


    document
        .getElementById(
            "stockStatusFilter"
        )
        ?.addEventListener(
            "change",
            event => {

                filtrosStock.estado =
                    event.target.value;

                renderStock();

            }
        );


    document
        .getElementById(
            "reloadStock"
        )
        ?.addEventListener(
            "click",
            cargarStock
        );

    // ==========================================
    // MOVIMIENTOS DE STOCK
    // ==========================================

    let movimientosStock = [];

    let filtrosMovimientos = {
        busqueda: "",
        tipo: ""
    };


    // ==========================================
    // CARGAR MOVIMIENTOS
    // ==========================================

    async function cargarMovimientos() {

        const tbody =
            document.getElementById(
                "movementsTableBody"
            );

        if (!tbody) {
            return;
        }


        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="loading">
                        Cargando movimientos...
                    </div>
                </td>
            </tr>
        `;


        try {

            movimientosStock =
                await apiFetch(
                    CONFIG.ENDPOINTS.movimientosStock
                );


            renderMovimientos();

        } catch (error) {

            console.error(
                "Error cargando movimientos:",
                error
            );


            tbody.innerHTML = `
                <tr>
                    <td colspan="9">
                        <div class="loading">
                            No se pudieron cargar los movimientos.
                        </div>
                    </td>
                </tr>
            `;

        }

    }


    // ==========================================
    // RENDER MOVIMIENTOS
    // ==========================================

    function renderMovimientos() {

        const tbody =
            document.getElementById(
                "movementsTableBody"
            );

        if (!tbody) {
            return;
        }


        let lista =
            [...movimientosStock];


        // ======================================
        // BÚSQUEDA
        // ======================================

        if (filtrosMovimientos.busqueda) {

            const texto =
                filtrosMovimientos.busqueda
                    .toLowerCase()
                    .trim();


            lista =
                lista.filter(
                    movimiento => {

                        const producto =
                            movimiento
                                .variante
                                ?.producto
                                ?.nombre
                                ?.toLowerCase() || "";


                        const motivo =
                            movimiento
                                .motivo
                                ?.toLowerCase() || "";


                        const talle =
                            movimiento
                                .variante
                                ?.talle
                                ?.nombre
                                ?.toLowerCase() || "";


                        const color =
                            movimiento
                                .variante
                                ?.color
                                ?.nombre
                                ?.toLowerCase() || "";


                        return (

                            producto.includes(texto) ||

                            motivo.includes(texto) ||

                            talle.includes(texto) ||

                            color.includes(texto)

                        );

                    }
                );

        }


        // ======================================
        // FILTRO TIPO
        // ======================================

        if (filtrosMovimientos.tipo) {

            lista =
                lista.filter(
                    movimiento =>
                        movimiento.tipo ===
                        filtrosMovimientos.tipo
                );

        }


        // ======================================
        // MÁS RECIENTE PRIMERO
        // ======================================

        lista.sort(
            (a, b) =>
                new Date(b.fecha) -
                new Date(a.fecha)
        );


        actualizarEstadisticasMovimientos();


        if (!lista.length) {

            tbody.innerHTML = `
                <tr>

                    <td colspan="9">

                        <div class="stock-empty-state">

                            <div>
                                ↕
                            </div>

                            <strong>
                                No hay movimientos
                            </strong>

                            <span>
                                No encontramos movimientos con los filtros seleccionados.
                            </span>

                        </div>

                    </td>

                </tr>
            `;

            return;
        }


        tbody.innerHTML =
            lista.map(
                movimiento => {

                    const variante =
                        movimiento.variante;


                    const producto =
                        variante
                            ?.producto
                            ?.nombre ||
                        "Sin producto";


                    const talle =
                        variante
                            ?.talle
                            ?.nombre ||
                        "-";


                    const color =
                        variante
                            ?.color
                            ?.nombre ||
                        "-";


                    const codigoHex =
                        variante
                            ?.color
                            ?.codigoHex ||
                        "#cccccc";


                    const tipo =
                        movimiento.tipo ||
                        "";


                    const cantidad =
                        Number(
                            movimiento.cantidad ||
                            0
                        );


                    const stockAnterior =
                        Number(
                            movimiento.stockAnterior ||
                            0
                        );


                    const stockPosterior =
                        Number(
                            movimiento.stockPosterior ||
                            0
                        );


                    return `
                        <tr>

                            <td>
                                ${formatearFechaPedido(
                                    movimiento.fecha
                                )}
                            </td>


                            <td>

                                <span
                                    class="movement-badge movement-${tipo.toLowerCase()}"
                                >
                                    ${formatearTipoMovimiento(
                                        tipo
                                    )}
                                </span>

                            </td>


                            <td>

                                <div class="movement-product">

                                    <strong>
                                        ${escapeHtml(
                                            producto
                                        )}
                                    </strong>

                                    <span>
                                        Variante #${variante?.id || "-"}
                                    </span>

                                </div>

                            </td>


                            <td>

                                <span class="stock-size">
                                    ${escapeHtml(
                                        talle
                                    )}
                                </span>

                            </td>


                            <td>

                                <div class="stock-color">

                                    <span
                                        class="stock-color-dot"
                                        style="
                                            background:${escapeHtml(
                                                codigoHex
                                            )}
                                        "
                                    ></span>

                                    ${escapeHtml(
                                        color
                                    )}

                                </div>

                            </td>


                            <td>

                                <strong
                                    class="movement-quantity movement-${tipo.toLowerCase()}"
                                >
                                    ${obtenerSignoMovimiento(tipo)}
                                    ${cantidad}
                                </strong>

                            </td>


                            <td>

                                ${stockAnterior}

                            </td>


                            <td>

                                <strong>
                                    ${stockPosterior}
                                </strong>

                            </td>


                            <td>

                                <span class="movement-reason">
                                    ${escapeHtml(
                                        movimiento.motivo ||
                                        "-"
                                    )}
                                </span>

                            </td>

                        </tr>
                    `;

                }
            ).join("");

    }


    // ==========================================
    // ESTADÍSTICAS MOVIMIENTOS
    // ==========================================

    function actualizarEstadisticasMovimientos() {

        const total =
            movimientosStock.length;


        const ventas =
            movimientosStock.filter(
                movimiento =>
                    movimiento.tipo ===
                    "VENTA"
            ).length;


        const devoluciones =
            movimientosStock.filter(
                movimiento =>
                    movimiento.tipo ===
                    "DEVOLUCION"
            ).length;


        const entradas =
            movimientosStock.filter(
                movimiento =>
                    movimiento.tipo ===
                    "ENTRADA"
            ).length;


        const totalElement =
            document.getElementById(
                "movimientosTotal"
            );


        const ventasElement =
            document.getElementById(
                "movimientosVentas"
            );


        const devolucionesElement =
            document.getElementById(
                "movimientosDevoluciones"
            );


        const entradasElement =
            document.getElementById(
                "movimientosEntradas"
            );


        if (totalElement) {
            totalElement.textContent =
                total;
        }


        if (ventasElement) {
            ventasElement.textContent =
                ventas;
        }


        if (devolucionesElement) {
            devolucionesElement.textContent =
                devoluciones;
        }


        if (entradasElement) {
            entradasElement.textContent =
                entradas;
        }

    }


    // ==========================================
    // FORMATEAR TIPO
    // ==========================================

    function formatearTipoMovimiento(
        tipo
    ) {

        const tipos = {

            ENTRADA: "Entrada",

            SALIDA: "Salida",

            AJUSTE: "Ajuste",

            VENTA: "Venta",

            DEVOLUCION: "Devolución"

        };


        return tipos[tipo] ||
            tipo;

    }


    // ==========================================
    // SIGNO
    // ==========================================

    function obtenerSignoMovimiento(
        tipo
    ) {

        if (
            tipo === "VENTA" ||
            tipo === "SALIDA"
        ) {

            return "-";

        }


        if (
            tipo === "ENTRADA" ||
            tipo === "DEVOLUCION"
        ) {

            return "+";

        }


        return "";
    }


    // ==========================================
    // EVENTOS
    // ==========================================

    document
        .getElementById(
            "movementSearch"
        )
        ?.addEventListener(
            "input",
            event => {

                filtrosMovimientos.busqueda =
                    event.target.value;

                renderMovimientos();

            }
        );


    document
        .getElementById(
            "movementTypeFilter"
        )
        ?.addEventListener(
            "change",
            event => {

                filtrosMovimientos.tipo =
                    event.target.value;

                renderMovimientos();

            }
        );


    document
        .getElementById(
            "reloadMovimientos"
        )
        ?.addEventListener(
            "click",
            cargarMovimientos
        );


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