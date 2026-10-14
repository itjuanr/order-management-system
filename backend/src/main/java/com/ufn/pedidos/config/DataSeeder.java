package com.ufn.pedidos.config;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.ufn.pedidos.auth.Role;
import com.ufn.pedidos.auth.Usuario;
import com.ufn.pedidos.auth.UsuarioRepository;
import com.ufn.pedidos.catalogo.Categoria;
import com.ufn.pedidos.catalogo.CategoriaRepository;
import com.ufn.pedidos.catalogo.Fornecedor;
import com.ufn.pedidos.catalogo.FornecedorRepository;
import com.ufn.pedidos.catalogo.Produto;
import com.ufn.pedidos.catalogo.ProdutoRepository;
import com.ufn.pedidos.cliente.Cliente;
import com.ufn.pedidos.cliente.ClienteRepository;
import com.ufn.pedidos.cliente.Endereco;
import com.ufn.pedidos.common.RegraDeNegocioException;
import com.ufn.pedidos.pedido.MetodoPagamento;
import com.ufn.pedidos.pedido.Pedido;
import com.ufn.pedidos.pedido.PedidoRepository;

/**
 * Cria o usuário admin quando não há usuários e, se app.seed.demo-data=true e o banco estiver vazio,
 * popula catálogo, clientes e cerca de seis meses de pedidos para o dashboard ter o que mostrar.
 */
@Component
public class DataSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

	private static final String[] NOMES = { "Ana", "Bruno", "Camila", "Diego", "Eduarda", "Felipe", "Gabriela",
			"Henrique", "Isabela", "João", "Larissa", "Lucas", "Mariana", "Matheus", "Natália", "Otávio", "Paula",
			"Rafael", "Sofia", "Thiago", "Vitória", "Gustavo", "Beatriz", "Leonardo", "Júlia", "Pedro", "Lívia",
			"Rodrigo", "Helena", "Caio" };
	private static final String[] SOBRENOMES = { "Silva", "Souza", "Oliveira", "Santos", "Lima", "Pereira",
			"Costa", "Rodrigues", "Almeida", "Nascimento", "Carvalho", "Ribeiro", "Martins", "Rocha", "Gomes",
			"Barbosa", "Ferreira", "Araújo", "Mendes", "Teixeira" };

	private final UsuarioRepository usuarios;
	private final ClienteRepository clientes;
	private final CategoriaRepository categorias;
	private final FornecedorRepository fornecedores;
	private final ProdutoRepository produtos;
	private final PedidoRepository pedidos;
	private final PasswordEncoder passwordEncoder;
	private final Clock clock;
	private final boolean demoData;

	private final Random random = new Random(42);

	public DataSeeder(UsuarioRepository usuarios, ClienteRepository clientes, CategoriaRepository categorias,
			FornecedorRepository fornecedores, ProdutoRepository produtos, PedidoRepository pedidos,
			PasswordEncoder passwordEncoder, Clock clock, @Value("${app.seed.demo-data:false}") boolean demoData) {
		this.usuarios = usuarios;
		this.clientes = clientes;
		this.categorias = categorias;
		this.fornecedores = fornecedores;
		this.produtos = produtos;
		this.pedidos = pedidos;
		this.passwordEncoder = passwordEncoder;
		this.clock = clock;
		this.demoData = demoData;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (usuarios.count() == 0) {
			usuarios.save(new Usuario("Marina Duarte", "admin", "marina.duarte@pontonorte.com.br", passwordEncoder.encode("admin123"), Role.ADMIN));
			log.warn("Usuário padrão criado: admin / admin123. Troque a senha em ambientes reais.");
		}
		if (demoData && clientes.count() == 0 && produtos.count() == 0) {
			popularDemonstracao();
		}
	}

	private void popularDemonstracao() {
		List<Cliente> listaClientes = criarClientes(36);
		List<Produto> catalogo = criarCatalogo();
		int criados = criarPedidos(listaClientes, catalogo);

		// Alguns produtos ficam abaixo do mínimo para o alerta de estoque aparecer no dashboard.
		ajustarEstoque(catalogo.get(3), 3);
		ajustarEstoque(catalogo.get(11), 6);
		ajustarEstoque(catalogo.get(17), 0);
		ajustarEstoque(catalogo.get(20), 8);

		log.info("Dados de demonstração criados: {} clientes, {} produtos, {} pedidos.", listaClientes.size(),
				catalogo.size(), criados);
	}

	private List<Cliente> criarClientes(int quantidade) {
		List<Cliente> lista = new ArrayList<>();
		List<String> usados = new ArrayList<>();
		while (lista.size() < quantidade) {
			String nome = escolher(NOMES) + " " + escolher(SOBRENOMES);
			if (usados.contains(nome)) {
				continue;
			}
			usados.add(nome);
			String email = semAcento(nome.toLowerCase()).replace(' ', '.') + "@email.com";
			String telefone = "559" + String.format("%08d", random.nextInt(100_000_000));
			lista.add(clientes.save(new Cliente(nome, gerarCpf(), email, telefone, enderecoAleatorio())));
		}
		return lista;
	}

	private List<Produto> criarCatalogo() {
		Categoria eletronicos = categorias.save(new Categoria("Eletrônicos", "Celulares, áudio e acessórios"));
		Categoria informatica = categorias.save(new Categoria("Informática", "Notebooks, periféricos e componentes"));
		Categoria escritorio = categorias.save(new Categoria("Escritório", "Móveis e materiais para escritório"));
		Categoria casa = categorias.save(new Categoria("Casa e Cozinha", "Utilidades e eletroportáteis"));
		Categoria esporte = categorias.save(new Categoria("Esporte e Lazer", "Equipamentos e acessórios esportivos"));
		categorias.save(new Categoria("Livros", "Livros técnicos e de negócios"));

		Fornecedor tech = fornecedores.save(new Fornecedor("TechDistribuidora LTDA", gerarCnpj(), "vendas@techdistribuidora.com.br", "1133224455"));
		Fornecedor info = fornecedores.save(new Fornecedor("InfoParts Comércio S.A.", gerarCnpj(), "contato@infoparts.com.br", "4130304040"));
		Fornecedor papel = fornecedores.save(new Fornecedor("Papelaria Central", gerarCnpj(), "pedidos@papelariacentral.com.br", "5132215566"));
		Fornecedor lar = fornecedores.save(new Fornecedor("Lar & Cia Utilidades", gerarCnpj(), "comercial@larecia.com.br", "1140028922"));
		Fornecedor sport = fornecedores.save(new Fornecedor("SportMax Atacado", gerarCnpj(), null, "2125554433"));

		Object[][] itens = {
				{ "ELE-001", "Smartphone Galaxy A55 128GB", "2199.00", eletronicos, tech },
				{ "ELE-002", "Fone Bluetooth com cancelamento de ruído", "349.90", eletronicos, tech },
				{ "ELE-003", "Caixa de som portátil 20W", "279.90", eletronicos, tech },
				{ "ELE-004", "Smartwatch Fit 3", "499.00", eletronicos, tech },
				{ "ELE-005", "Carregador turbo USB-C 30W", "89.90", eletronicos, tech },
				{ "INF-001", "Notebook Pro 14\" 16GB 512GB", "6499.90", informatica, info },
				{ "INF-002", "Mouse sem fio ergonômico", "129.50", informatica, info },
				{ "INF-003", "Teclado mecânico ABNT2", "389.00", informatica, info },
				{ "INF-004", "Monitor 27\" IPS QHD", "1799.00", informatica, info },
				{ "INF-005", "SSD NVMe 1TB", "459.90", informatica, info },
				{ "INF-006", "Webcam Full HD", "249.90", informatica, info },
				{ "ESC-001", "Cadeira ergonômica Office", "1289.00", escritorio, papel },
				{ "ESC-002", "Mesa de escritório 120cm", "699.00", escritorio, papel },
				{ "ESC-003", "Kit cadernos A4 (5 un.)", "64.90", escritorio, papel },
				{ "ESC-004", "Luminária de mesa LED", "149.90", escritorio, papel },
				{ "CAS-001", "Cafeteira elétrica 1,2L", "229.90", casa, lar },
				{ "CAS-002", "Air fryer 4L", "449.00", casa, lar },
				{ "CAS-003", "Jogo de panelas antiaderente (5 pç)", "389.90", casa, lar },
				{ "CAS-004", "Liquidificador 1000W", "199.90", casa, lar },
				{ "ESP-001", "Bicicleta ergométrica", "1499.00", esporte, sport },
				{ "ESP-002", "Kit halteres 20kg", "329.00", esporte, sport },
				{ "ESP-003", "Tapete de yoga premium", "119.90", esporte, sport },
				{ "ESP-004", "Garrafa térmica 1L", "89.00", esporte, sport }, };

		List<Produto> lista = new ArrayList<>();
		for (Object[] i : itens) {
			lista.add(produtos.save(new Produto((String) i[0], (String) i[1], null, new BigDecimal((String) i[2]),
					300 + random.nextInt(200), 15, true, (Categoria) i[3], (Fornecedor) i[4])));
		}
		return lista;
	}

	private int criarPedidos(List<Cliente> listaClientes, List<Produto> catalogo) {
		LocalDateTime agora = LocalDateTime.now(clock);
		int dias = 180;
		int criados = 0;

		for (int d = dias; d >= 0; d--) {
			// Volume cresce ao longo do período para o gráfico mostrar tendência.
			double media = 0.6 + 1.8 * (dias - d) / dias;
			int quantidadeNoDia = (int) Math.round(media + random.nextGaussian() * 0.8);

			for (int n = 0; n < quantidadeNoDia; n++) {
				LocalDateTime criadoEm = agora.minusDays(d).withHour(8 + random.nextInt(12))
						.withMinute(random.nextInt(60)).withSecond(0).withNano(0);
				if (criadoEm.isAfter(agora)) {
					criadoEm = agora.minusMinutes(5 + random.nextInt(120));
				}
				try {
					pedidos.save(montarPedido(listaClientes, catalogo, criadoEm, d));
					criados++;
				} catch (RegraDeNegocioException semEstoque) {
					// pula pedidos que estourariam o estoque gerado
				}
			}
		}
		return criados;
	}

	private Pedido montarPedido(List<Cliente> listaClientes, List<Produto> catalogo, LocalDateTime criadoEm, int idadeEmDias) {
		Pedido pedido = new Pedido(escolher(listaClientes), null, criadoEm);
		int quantidadeItens = 1 + (random.nextDouble() < 0.45 ? 1 : 0) + (random.nextDouble() < 0.15 ? 1 : 0);
		for (int i = 0; i < quantidadeItens; i++) {
			Produto produto = catalogo.get(Math.min(catalogo.size() - 1, (int) Math.abs(random.nextGaussian() * 8)));
			pedido.adicionarItem(produto, 1 + (random.nextDouble() < 0.25 ? random.nextInt(3) : 0));
		}

		double sorte = random.nextDouble();
		if (idadeEmDias <= 1) {
			if (sorte < 0.5) {
				return pedido; // aguardando pagamento
			}
			pedido.pagar(metodo(), criadoEm.plusMinutes(10 + random.nextInt(60)));
			return pedido;
		}
		if (sorte < 0.06) {
			pedido.cancelar(criadoEm.plusHours(2 + random.nextInt(24)));
			return pedido;
		}

		LocalDateTime pagoEm = criadoEm.plusMinutes(5 + random.nextInt(600));
		pedido.pagar(metodo(), pagoEm);
		if (sorte < 0.09) {
			pedido.cancelar(pagoEm.plusHours(3 + random.nextInt(20)));
			return pedido;
		}
		if (idadeEmDias <= 3 && sorte < 0.6) {
			return pedido; // pago, aguardando envio
		}
		LocalDateTime enviadoEm = pagoEm.plusHours(12 + random.nextInt(36));
		pedido.enviar(enviadoEm);
		if (idadeEmDias <= 7 && sorte < 0.7) {
			return pedido; // em trânsito
		}
		pedido.entregar(enviadoEm.plusDays(1 + random.nextInt(4)));
		return pedido;
	}

	/** CEPs reais (conferidos no ViaCEP); o número e o complemento são sorteados. */
	private static final String[][] ENDERECOS = {
			{ "01310100", "Avenida Paulista", "Bela Vista", "São Paulo", "SP" },
			{ "20040020", "Praça Pio X", "Centro", "Rio de Janeiro", "RJ" },
			{ "30130110", "Alameda Ezequiel Dias", "Centro", "Belo Horizonte", "MG" },
			{ "80020310", "Rua XV de Novembro", "Centro", "Curitiba", "PR" },
			{ "90010150", "Praça da Alfândega", "Centro Histórico", "Porto Alegre", "RS" },
			{ "97010001", "Rua Venâncio Aires", "Centro", "Santa Maria", "RS" },
			{ "88010400", "Praça Quinze de Novembro", "Centro", "Florianópolis", "SC" },
			{ "01001000", "Praça da Sé", "Sé", "São Paulo", "SP" }, };

	private Endereco enderecoAleatorio() {
		String[] e = ENDERECOS[random.nextInt(ENDERECOS.length)];
		String complemento = random.nextDouble() < 0.4 ? "Apto " + (11 + random.nextInt(180)) : null;
		return new Endereco(e[0], e[1], String.valueOf(10 + random.nextInt(2900)), complemento, e[2], e[3], e[4]);
	}

	private void ajustarEstoque(Produto p, int estoque) {
		p.atualizar(p.getSku(), p.getNome(), p.getDescricao(), p.getPreco(), estoque, p.getEstoqueMinimo(), p.isAtivo(),
				p.getCategoria(), p.getFornecedor());
	}

	private MetodoPagamento metodo() {
		double r = random.nextDouble();
		if (r < 0.45) {
			return MetodoPagamento.PIX;
		}
		if (r < 0.80) {
			return MetodoPagamento.CARTAO_CREDITO;
		}
		return r < 0.92 ? MetodoPagamento.CARTAO_DEBITO : MetodoPagamento.BOLETO;
	}

	private <T> T escolher(T[] opcoes) {
		return opcoes[random.nextInt(opcoes.length)];
	}

	private <T> T escolher(List<T> opcoes) {
		return opcoes.get(random.nextInt(opcoes.size()));
	}

	private String gerarCpf() {
		int[] d = new int[11];
		for (int i = 0; i < 9; i++) {
			d[i] = random.nextInt(10);
		}
		d[9] = digitoVerificador(d, 9, 10);
		d[10] = digitoVerificador(d, 10, 11);
		StringBuilder sb = new StringBuilder();
		for (int x : d) {
			sb.append(x);
		}
		return sb.toString();
	}

	private static int digitoVerificador(int[] d, int tamanho, int pesoInicial) {
		int soma = 0;
		for (int i = 0; i < tamanho; i++) {
			soma += d[i] * (pesoInicial - i);
		}
		int resto = (soma * 10) % 11;
		return resto == 10 ? 0 : resto;
	}

	private String gerarCnpj() {
		int[] d = new int[14];
		for (int i = 0; i < 8; i++) {
			d[i] = random.nextInt(10);
		}
		d[11] = 1; // filial 0001
		int[] pesos1 = { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
		int[] pesos2 = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
		d[12] = digitoCnpj(d, pesos1);
		d[13] = digitoCnpj(d, pesos2);
		StringBuilder sb = new StringBuilder();
		for (int x : d) {
			sb.append(x);
		}
		return sb.toString();
	}

	private static int digitoCnpj(int[] d, int[] pesos) {
		int soma = 0;
		for (int i = 0; i < pesos.length; i++) {
			soma += d[i] * pesos[i];
		}
		int resto = soma % 11;
		return resto < 2 ? 0 : 11 - resto;
	}

	private static String semAcento(String texto) {
		return java.text.Normalizer.normalize(texto, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}", "");
	}
}
