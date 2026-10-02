const STORAGE_KEY = "victoriaPedido";

let pedido = [];
let ofertaActual = 0;


/* =========================
   PEDIDO / LOCAL STORAGE
========================= */

function cargarPedido(){
    try{
        const guardado = localStorage.getItem(STORAGE_KEY);

        if(guardado){
            pedido = JSON.parse(guardado);
        }else{
            pedido = [];
        }

        if(!Array.isArray(pedido)){
            pedido = [];
        }

    }catch(error){
        pedido = [];
    }
}


function guardarPedido(){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(pedido));
    actualizarIndicadores();
}


/* =========================
   FORMATO DE PRECIOS
========================= */

function formatearPrecio(numero){
    return "$" + Number(numero).toLocaleString("es-AR");
}


/* =========================
   CALCULOS
========================= */

function obtenerPrecioExtras(extras){
    if(!Array.isArray(extras)){
        return 0;
    }

    return extras.reduce(function(total,extra){
        return total + Number(extra.precio || 0);
    },0);
}


function obtenerPrecioUnitario(item){
    return Number(item.precio || 0) + obtenerPrecioExtras(item.extras);
}


function obtenerCantidadTotal(){
    return pedido.reduce(function(total,item){
        return total + Number(item.cantidad || 0);
    },0);
}


function obtenerTotal(){
    return pedido.reduce(function(total,item){
        return total + obtenerPrecioUnitario(item) * Number(item.cantidad || 0);
    },0);
}


/* =========================
   INDICADORES GENERALES
========================= */

function actualizarIndicadores(){

    const cantidad = obtenerCantidadTotal();
    const total = obtenerTotal();

    const contadores = document.querySelectorAll(
        "#contador-carrito,#pedido-contador"
    );

    contadores.forEach(function(contador){
        contador.textContent = cantidad;
    });


    const totales = document.querySelectorAll(
        "#pedido-total"
    );

    totales.forEach(function(elemento){
        elemento.textContent = formatearPrecio(total);
    });


    const resumenCantidad = document.getElementById("resumen-cantidad");

    if(resumenCantidad){
        resumenCantidad.textContent = cantidad;
    }


    const resumenSubtotal = document.getElementById("resumen-subtotal");

    if(resumenSubtotal){
        resumenSubtotal.textContent = formatearPrecio(total);
    }


    const resumenTotal = document.getElementById("resumen-total");

    if(resumenTotal){
        resumenTotal.textContent = formatearPrecio(total);
    }
}


/* =========================
   AGREGAR PRODUCTOS
========================= */

function agregarProducto(nombre,precio,extras = []){

    precio = Number(precio);

    const extrasNormalizados = extras.map(function(extra){
        return {
            nombre:extra.nombre,
            precio:Number(extra.precio || 0)
        };
    });

    extrasNormalizados.sort(function(a,b){
        return a.nombre.localeCompare(b.nombre);
    });


    const claveExtras = extrasNormalizados
        .map(function(extra){
            return extra.nombre + "-" + extra.precio;
        })
        .join("|");


    const productoExistente = pedido.find(function(item){

        const extrasItem = Array.isArray(item.extras)
            ? [...item.extras].sort(function(a,b){
                return a.nombre.localeCompare(b.nombre);
            })
            : [];

        const claveItem = extrasItem
            .map(function(extra){
                return extra.nombre + "-" + extra.precio;
            })
            .join("|");

        return item.nombre === nombre &&
               Number(item.precio) === precio &&
               claveItem === claveExtras;
    });


    if(productoExistente){

        productoExistente.cantidad += 1;

    }else{

        pedido.push({
            id:Date.now() + Math.random(),
            nombre:nombre,
            precio:precio,
            extras:extrasNormalizados,
            cantidad:1
        });

    }

    guardarPedido();
    mostrarConfirmacionAgregar(nombre);
}


/* =========================
   PEQUEÑA CONFIRMACION
========================= */

function mostrarConfirmacionAgregar(nombre){

    let aviso = document.getElementById("aviso-agregado");

    if(!aviso){

        aviso = document.createElement("div");

        aviso.id = "aviso-agregado";

        aviso.style.position = "fixed";
        aviso.style.right = "25px";
        aviso.style.top = "100px";
        aviso.style.zIndex = "100";
        aviso.style.padding = "12px 18px";
        aviso.style.borderRadius = "12px";
        aviso.style.background = "#32180b";
        aviso.style.color = "white";
        aviso.style.fontSize = "12px";
        aviso.style.fontWeight = "bold";
        aviso.style.boxShadow = "0 12px 30px rgba(0,0,0,.25)";
        aviso.style.transition = "opacity .3s, transform .3s";

        document.body.appendChild(aviso);
    }

    aviso.textContent = nombre + " agregado al pedido";

    aviso.style.opacity = "1";
    aviso.style.transform = "translateY(0)";

    clearTimeout(window.avisoPedidoTimer);

    window.avisoPedidoTimer = setTimeout(function(){

        aviso.style.opacity = "0";
        aviso.style.transform = "translateY(-10px)";

    },1800);
}


/* =========================
   PRODUCTOS DE INDEX
========================= */

function inicializarBotonesInicio(){

    const botones = document.querySelectorAll(".btn-agregar");

    botones.forEach(function(boton){

        boton.addEventListener("click",function(event){

            event.preventDefault();
            event.stopPropagation();

            const nombre = boton.dataset.producto;
            const precio = Number(boton.dataset.precio);

            if(!nombre || !precio){
                return;
            }

            agregarProducto(nombre,precio,[]);
        });
    });
}


/* =========================
   PRODUCTOS DEL CATALOGO
========================= */

function obtenerExtrasDeProducto(item){

    const adicionales = item.querySelector(".adicionales");

    if(!adicionales){
        return [];
    }

    const extras = [];

    const seleccionados = adicionales.querySelectorAll(
        'input[type="checkbox"]:checked'
    );

    seleccionados.forEach(function(input){

        const label = input.closest("label");

        if(!label){
            return;
        }

        const nombreExtra =
            input.dataset.nombre ||
            label.dataset.nombre ||
            label.querySelector("span")?.textContent?.trim() ||
            "Adicional";

        const precioExtra = Number(
            input.dataset.precio ||
            label.dataset.precio ||
            0
        );

        extras.push({
            nombre:nombreExtra,
            precio:precioExtra
        });
    });

    return extras;
}


function actualizarPrecioProducto(item){

    const boton = item.querySelector(".producto-boton");
    const precioElemento = item.querySelector(".precio");

    if(!boton || !precioElemento){
        return;
    }

    const precioBase = Number(
        boton.dataset.precio ||
        boton.dataset.basePrice ||
        precioElemento.dataset.basePrice ||
        0
    );

    if(!precioBase){
        return;
    }

    precioElemento.dataset.basePrice = precioBase;

    const extras = obtenerExtrasDeProducto(item);
    const precioExtras = obtenerPrecioExtras(extras);

    precioElemento.textContent =
        formatearPrecio(precioBase + precioExtras);
}


function inicializarPersonalizacion(item){

    const botonPersonalizar =
        item.querySelector(".btn-personalizar");

    const adicionales =
        item.querySelector(".adicionales");


    if(botonPersonalizar && adicionales){

        botonPersonalizar.addEventListener("click",function(event){

            event.preventDefault();
            event.stopPropagation();

            adicionales.classList.toggle("mostrar");

            if(adicionales.classList.contains("mostrar")){
                botonPersonalizar.textContent = "Ocultar opciones";
            }else{
                botonPersonalizar.textContent = "Personalizar";
            }
        });
    }


    const checkboxes =
        item.querySelectorAll(
            '.adicionales input[type="checkbox"]'
        );


    checkboxes.forEach(function(checkbox){

        checkbox.addEventListener("change",function(){

            actualizarPrecioProducto(item);

        });

    });
}


function inicializarProductos(){

    const productos =
        document.querySelectorAll(".item");

    productos.forEach(function(item){

        inicializarPersonalizacion(item);

        const boton =
            item.querySelector(".producto-boton");

        if(!boton){
            return;
        }


        const icono =
            item.querySelector(".icono-producto");


        boton.addEventListener("click",function(event){

            /*
             * Si se hizo click directamente
             * sobre el +, se agrega el producto.
             */
            if(
                icono &&
                event.target.closest(".icono-producto")
            ){

                event.preventDefault();
                event.stopPropagation();

                const info =
                    item.querySelector(".item-info");

                if(!info){
                    return;
                }

                const nombreElemento =
                    info.querySelector("strong");

                const nombre =
                    nombreElemento
                    ? nombreElemento.textContent.trim()
                    : "Producto";


                const precioBase =
                    Number(
                        boton.dataset.precio ||
                        boton.dataset.basePrice ||
                        item.querySelector(".precio")?.dataset.basePrice ||
                        0
                    );


                const extras =
                    obtenerExtrasDeProducto(item);


                if(precioBase > 0){

                    agregarProducto(
                        nombre,
                        precioBase,
                        extras
                    );


                    /*
                     * Después de agregar,
                     * limpiamos los adicionales
                     * para el próximo producto.
                     */

                    const checks =
                        item.querySelectorAll(
                            '.adicionales input[type="checkbox"]'
                        );

                    checks.forEach(function(check){
                        check.checked = false;
                    });

                    actualizarPrecioProducto(item);

                }

                return;
            }


            /*
             * Si se hizo click sobre el producto,
             * se abre/cierra su detalle.
             */

            item.classList.toggle("abierto");

        });
    });
}


/* =========================
   COMBOS DEL CARRUSEL
========================= */

function agregarCombo(oferta){

    if(!oferta){
        return;
    }

    const nombre =
        oferta.dataset.producto ||
        oferta.querySelector("h3")?.textContent.trim();

    const precio =
        Number(
            oferta.dataset.precio ||
            oferta.querySelector("strong")?.textContent
                .replace("$","")
                .replace(/\./g,"")
                .trim() ||
            0
        );

    if(!nombre || !precio){
        return;
    }

    agregarProducto(nombre,precio,[]);
}


function inicializarCombos(){

    const ofertas =
        document.querySelectorAll(".oferta");

    ofertas.forEach(function(oferta){

        oferta.addEventListener("click",function(event){

            if(
                event.target.closest(".flecha") ||
                event.target.closest(".punto")
            ){
                return;
            }

            agregarCombo(oferta);

        });
    });


    const botones =
        document.querySelectorAll(".btn-agregar-combo");

    botones.forEach(function(boton){

        boton.addEventListener("click",function(event){

            event.preventDefault();
            event.stopPropagation();

            const oferta =
                boton.closest(".oferta");

            agregarCombo(oferta);

        });
    });
}


/* =========================
   CARRUSEL
========================= */

function mostrarOferta(indice){

    const ofertas =
        document.querySelectorAll(".oferta");

    const puntos =
        document.querySelectorAll(".punto");


    if(!ofertas.length){
        return;
    }


    if(indice < 0){
        indice = ofertas.length - 1;
    }

    if(indice >= ofertas.length){
        indice = 0;
    }


    ofertaActual = indice;


    ofertas.forEach(function(oferta,i){

        oferta.classList.toggle(
            "activa",
            i === ofertaActual
        );

    });


    puntos.forEach(function(punto,i){

        punto.classList.toggle(
            "activo",
            i === ofertaActual
        );

    });
}


function siguienteOferta(){

    mostrarOferta(ofertaActual + 1);

}


function anteriorOferta(){

    mostrarOferta(ofertaActual - 1);

}


function irAOferta(indice){

    mostrarOferta(indice);

}


function inicializarCarrusel(){

    const ofertas =
        document.querySelectorAll(".oferta");

    const puntos =
        document.querySelectorAll(".punto");

    if(!ofertas.length){
        return;
    }


    let activa =
        document.querySelector(".oferta.activa");

    if(activa){

        ofertas.forEach(function(oferta,i){

            if(oferta === activa){
                ofertaActual = i;
            }

        });

    }else{

        ofertaActual = 0;
        mostrarOferta(0);

    }


    puntos.forEach(function(punto,i){

        punto.addEventListener("click",function(){

            irAOferta(i);

        });

    });


    setInterval(function(){

        siguienteOferta();

    },5000);
}


/* =========================
   CARRITO
========================= */

function renderizarCarrito(){

    const contenedor =
        document.getElementById("carrito-productos");

    const vacio =
        document.getElementById("carrito-vacio");


    if(!contenedor){
        return;
    }


    contenedor.innerHTML = "";


    if(pedido.length === 0){

        if(vacio){
            vacio.style.display = "block";
        }

        actualizarIndicadores();

        return;
    }


    if(vacio){
        vacio.style.display = "none";
    }


    pedido.forEach(function(item,index){

        const elemento =
            document.createElement("div");

        elemento.className = "carrito-item";


        const extrasTexto =
            Array.isArray(item.extras) &&
            item.extras.length > 0

            ? "Extras: " +
              item.extras
                  .map(function(extra){
                      return extra.nombre;
                  })
                  .join(", ")

            : "Sin adicionales";


        const precioUnitario =
            obtenerPrecioUnitario(item);


        const totalProducto =
            precioUnitario *
            Number(item.cantidad || 0);


        elemento.innerHTML = `

            <div class="carrito-item-info">

                <strong>
                    ${escaparHTML(item.nombre)}
                </strong>

                <small>
                    ${escaparHTML(extrasTexto)}
                </small>

            </div>


            <div class="carrito-item-precio">

                ${formatearPrecio(totalProducto)}

            </div>


            <div class="carrito-cantidad">

                <button
                    class="cantidad-btn"
                    data-accion="restar"
                    data-index="${index}">
                    −
                </button>

                <strong>
                    ${item.cantidad}
                </strong>

                <button
                    class="cantidad-btn"
                    data-accion="sumar"
                    data-index="${index}">
                    +
                </button>

            </div>


            <button
                class="carrito-eliminar"
                data-accion="eliminar"
                data-index="${index}">

                Eliminar

            </button>

        `;


        contenedor.appendChild(elemento);

    });


    inicializarAccionesCarrito();

    actualizarIndicadores();
}


function escaparHTML(texto){

    return String(texto)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}


/* =========================
   ACCIONES CARRITO
========================= */

function inicializarAccionesCarrito(){

    const botones =
        document.querySelectorAll(
            ".cantidad-btn,.carrito-eliminar"
        );


    botones.forEach(function(boton){

        boton.addEventListener("click",function(){

            const indice =
                Number(boton.dataset.index);

            const accion =
                boton.dataset.accion;


            if(
                Number.isNaN(indice) ||
                !pedido[indice]
            ){
                return;
            }


            if(accion === "sumar"){

                pedido[indice].cantidad += 1;

            }


            if(accion === "restar"){

                pedido[indice].cantidad -= 1;

                if(pedido[indice].cantidad <= 0){

                    pedido.splice(indice,1);

                }

            }


            if(accion === "eliminar"){

                pedido.splice(indice,1);

            }


            guardarPedido();
            renderizarCarrito();

        });

    });
}


/* =========================
   VACIAR PEDIDO
========================= */

function vaciarPedido(){

    pedido = [];

    guardarPedido();

    renderizarCarrito();
}


function inicializarBotonVaciar(){

    const boton =
        document.getElementById("btn-vaciar");

    if(!boton){
        return;
    }


    boton.addEventListener("click",function(){

        if(pedido.length === 0){
            return;
        }


        const confirmar =
            window.confirm(
                "¿Querés vaciar todo el pedido?"
            );


        if(!confirmar){
            return;
        }


        vaciarPedido();

    });
}


/* =========================
   CONFIRMAR PEDIDO
========================= */

function inicializarConfirmacion(){

    const boton =
        document.getElementById("btn-confirmar");

    const confirmacion =
        document.getElementById("pedido-confirmado");

    const contenido =
        document.querySelector(".carrito-contenido");


    if(!boton || !confirmacion){
        return;
    }


    boton.addEventListener("click",function(){

        if(pedido.length === 0){

            window.alert(
                "Todavía no agregaste ningún producto al pedido."
            );

            return;
        }


        if(contenido){
            contenido.style.display = "none";
        }


        confirmacion.classList.add("mostrar");

        window.scrollTo({
            top:0,
            behavior:"smooth"
        });

    });
}


/* =========================
   INICIALIZACION
========================= */

document.addEventListener("DOMContentLoaded",function(){

    cargarPedido();

    actualizarIndicadores();

    inicializarBotonesInicio();

    inicializarProductos();

    inicializarCombos();

    inicializarCarrusel();

    inicializarBotonVaciar();

    inicializarConfirmacion();

    renderizarCarrito();

});


/* =========================
   FUNCIONES GLOBALES
========================= */

window.siguienteOferta = siguienteOferta;
window.anteriorOferta = anteriorOferta;
window.irAOferta = irAOferta;
