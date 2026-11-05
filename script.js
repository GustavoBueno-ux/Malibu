
"use strict";

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const WHATSAPP_NUMBER = "5514998634380";

const products = [
  {
    id: "torta",
    name: "Torta de cookie",
    icon: "🍪",
    description: "Torta de cookie recheada com Nutella.",
    options: ["Sem sorvete", "Com sorvete"]
  },
  {
    id: "cookie",
    name: "Cookie individual de Kinder",
    icon: "🍪",
    description: "Cookie recheado para adoçar o seu dia.",
    options: []
  },
  {
    id: "burger",
    name: "Mini hambúrguer",
    icon: "🍔",
    description: "Pequeno no tamanho, grande no sabor.",
    options: []
  },
  {
    id: "combo",
    name: "Combo mini hambúrguer",
    icon: "🥤",
    description: "Mini hambúrguer acompanhado de bebida.",
    options: ["Guaraná", "Coca-Cola"]
  },
  {
    id: "acai",
    name: "Açaí",
    icon: "🥣",
    description: "Escolha a opção de acompanhamento.",
    options: ["Leite em pó", "Leite condensado", "Leite condensado e em pó"]
  }
];

// ==========================================
// ELEMENTOS DO HTML
// ==========================================

const cart = new Map();

const productsEl = document.getElementById("products");
const cartEl = document.getElementById("cart");
const cartCountEl = document.getElementById("cart-count");
const nameEl = document.getElementById("customer-name");
const errorEl = document.getElementById("name-error");
const orderForm = document.getElementById("order-form");

const clean = value => String(value).replace(/[<>]/g, "");

// ==========================================
// RENDERIZAÇÃO DOS PRODUTOS
// ==========================================

function renderProducts() {
  productsEl.innerHTML = products.map(product => {
    const optionsHTML = product.options.length
      ? `
        <label for="option-${product.id}">
          ${product.id === "torta"
            ? "Deseja adicionar sorvete?"
            : "Escolha uma opção"}
        </label>

        <select id="option-${product.id}">
          ${product.options.map(option => `
            <option value="${option}">${option}</option>
          `).join("")}
        </select>
      `
      : "";

    return `
      <article class="product reveal">
        <div class="product-icon" aria-hidden="true">
          ${product.icon}
        </div>

        <h3>${product.name}</h3>
        <p>${product.description}</p>

        ${optionsHTML}

        <button
          class="add"
          type="button"
          data-add="${product.id}"
        >
          + Adicionar ao pedido
        </button>
      </article>
    `;
  }).join("");
}

// ==========================================
// ADICIONAR PRODUTOS
// ==========================================

productsEl.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");

  if (!button) return;

  const product = products.find(
    item => item.id === button.dataset.add
  );

  if (!product) return;

  const option =
    document.getElementById(`option-${product.id}`)?.value || "";

  const key = `${product.id}:${option}`;
  const existing = cart.get(key);

  cart.set(key, {
    product,
    option,
    quantity: Math.min((existing?.quantity || 0) + 1, 99)
  });

  renderCart();

  button.textContent = "✓ Adicionado";

  setTimeout(() => {
    button.textContent = "+ Adicionar ao pedido";
  }, 1100);
});

// ==========================================
// CARRINHO
// ==========================================

function renderCart() {
  const items = [...cart.entries()];

  const total = items.reduce(
    (sum, [, item]) => sum + item.quantity,
    0
  );

  cartCountEl.textContent = total;

  if (!items.length) {
    cartEl.innerHTML = `
      <p class="empty">
        Seu pedido está vazio.
        Escolha algo gostoso no cardápio! ♡
      </p>
    `;
    return;
  }

  cartEl.innerHTML = items.map(([key, item], index) => `
    <div class="cart-item">
      <div>
        <div class="cart-name">
          ${item.product.name}
        </div>

        ${item.option ? `
          <div class="cart-variant">
            ${clean(item.option)}
          </div>
        ` : ""}
      </div>

      <div class="qty">
        <button
          type="button"
          data-index="${index}"
          data-change="-1"
          aria-label="Diminuir quantidade"
        >
          −
        </button>

        <span>${item.quantity}</span>

        <button
          type="button"
          data-index="${index}"
          data-change="1"
          aria-label="Aumentar quantidade"
        >
          +
        </button>
      </div>
    </div>
  `).join("");
}

// ==========================================
// ALTERAR QUANTIDADES
// ==========================================

cartEl.addEventListener("click", event => {
  const button = event.target.closest("[data-change]");

  if (!button) return;

  const key = [...cart.keys()][Number(button.dataset.index)];

  if (!key) return;

  const item = cart.get(key);

  item.quantity += Number(button.dataset.change);

  if (item.quantity <= 0) {
    cart.delete(key);
  } else {
    item.quantity = Math.min(item.quantity, 99);
  }

  renderCart();
});

// ==========================================
// VALIDAÇÃO DO NOME
// ==========================================

function validateName(value) {
  const name = value.trim().replace(/\s+/g, " ");
  const parts = name.split(" ");

  if (name.length < 5 || parts.length < 2) {
    return "Informe seu nome e sobrenome para identificação.";
  }

  const validCharacters =
    /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;

  if (!validCharacters.test(name)) {
    return "Use apenas letras, espaços, hífen ou apóstrofo.";
  }

  if (parts.some(part => part.replace(/[-']/g, "").length < 2)) {
    return "Digite um nome e sobrenome válidos.";
  }

  return "";
}

// ==========================================
// FINALIZAR PEDIDO PELO WHATSAPP
// ==========================================

orderForm.addEventListener("submit", event => {
  event.preventDefault();

  errorEl.textContent = "";

  const items = [...cart.values()];

  if (!items.length) {
    errorEl.textContent =
      "Adicione pelo menos um produto antes de enviar.";

    document.getElementById("cardapio")
      .scrollIntoView({ behavior: "smooth" });

    return;
  }

  const name = nameEl.value.trim().replace(/\s+/g, " ");
  const error = validateName(name);

  if (error) {
    errorEl.textContent = error;
    nameEl.focus();
    return;
  }

  const lines = items.map(item => {
    const option = item.option ? ` — ${item.option}` : "";

    return `• ${item.quantity}x ${item.product.name}${option}`;
  });

  const message = [
    "Olá, equipe Malibu!",
    "",
    "Gostaria de fazer uma encomenda para a Feira Gastronômica do dia 27/11.",
    "",
    `*Nome:* ${name}`,
    "",
    "*Meu pedido:*",
    ...lines,
    "",
    "Podem confirmar a disponibilidade e os valores, por favor?"
  ].join("\n");

  const url =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");
});

// ==========================================
// ANIMAÇÕES AO ROLAR A PÁGINA
// ==========================================

function initializeAnimations() {
  const reveals = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08
    });

    reveals.forEach(element => observer.observe(element));
  } else {
    reveals.forEach(element => {
      element.classList.add("visible");
    });
  }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

renderProducts();
renderCart();
initializeAnimations();
