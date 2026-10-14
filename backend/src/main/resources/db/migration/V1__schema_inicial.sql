-- Schema compatível com MySQL 8 e com o H2 em modo MySQL (perfil dev).

CREATE TABLE usuarios (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    login      VARCHAR(50)  NOT NULL,
    email      VARCHAR(120) NOT NULL,
    senha      VARCHAR(100) NOT NULL,
    role       VARCHAR(20)  NOT NULL,
    criado_em  DATETIME(6)  NOT NULL,
    CONSTRAINT uk_usuarios_login UNIQUE (login)
);

CREATE TABLE clientes (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome       VARCHAR(120) NOT NULL,
    cpf        VARCHAR(11)  NOT NULL,
    email      VARCHAR(120) NOT NULL,
    telefone   VARCHAR(11),
    criado_em  DATETIME(6)  NOT NULL,
    CONSTRAINT uk_clientes_cpf UNIQUE (cpf)
);

CREATE TABLE categorias (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome       VARCHAR(60)  NOT NULL,
    descricao  VARCHAR(255),
    CONSTRAINT uk_categorias_nome UNIQUE (nome)
);

CREATE TABLE fornecedores (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome       VARCHAR(120) NOT NULL,
    cnpj       VARCHAR(14)  NOT NULL,
    email      VARCHAR(120),
    telefone   VARCHAR(11),
    CONSTRAINT uk_fornecedores_cnpj UNIQUE (cnpj)
);

CREATE TABLE produtos (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    sku             VARCHAR(30)    NOT NULL,
    nome            VARCHAR(120)   NOT NULL,
    descricao       VARCHAR(500),
    preco           DECIMAL(12, 2) NOT NULL,
    estoque         INT            NOT NULL,
    estoque_minimo  INT            NOT NULL,
    ativo           BOOLEAN        NOT NULL,
    categoria_id    BIGINT         NOT NULL,
    fornecedor_id   BIGINT         NOT NULL,
    CONSTRAINT uk_produtos_sku UNIQUE (sku),
    CONSTRAINT fk_produtos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias (id),
    CONSTRAINT fk_produtos_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES fornecedores (id)
);

CREATE TABLE pedidos (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id    BIGINT         NOT NULL,
    status        VARCHAR(30)    NOT NULL,
    total         DECIMAL(12, 2) NOT NULL,
    observacao    VARCHAR(500),
    criado_em     DATETIME(6)    NOT NULL,
    pago_em       DATETIME(6),
    enviado_em    DATETIME(6),
    entregue_em   DATETIME(6),
    cancelado_em  DATETIME(6),
    CONSTRAINT fk_pedidos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id)
);

CREATE INDEX idx_pedidos_status ON pedidos (status);
CREATE INDEX idx_pedidos_criado_em ON pedidos (criado_em);

CREATE TABLE itens_pedido (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id       BIGINT         NOT NULL,
    produto_id      BIGINT         NOT NULL,
    quantidade      INT            NOT NULL,
    preco_unitario  DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_itens_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id),
    CONSTRAINT fk_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos (id)
);

CREATE TABLE pagamentos (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id  BIGINT         NOT NULL,
    metodo     VARCHAR(20)    NOT NULL,
    valor      DECIMAL(12, 2) NOT NULL,
    pago_em    DATETIME(6)    NOT NULL,
    CONSTRAINT uk_pagamentos_pedido UNIQUE (pedido_id),
    CONSTRAINT fk_pagamentos_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
);
