-- ═══════════════════════════════════════════════════════════════
-- QHIETHUS — Category Content Table
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.category_content (
  category        text PRIMARY KEY,
  desc_col1_html  text NOT NULL DEFAULT '',
  desc_col2_html  text NOT NULL DEFAULT '',
  timeline        jsonb NOT NULL DEFAULT '[]',
  figures         jsonb NOT NULL DEFAULT '[]',
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.category_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read category content" ON public.category_content;
CREATE POLICY "Anyone can read category content"
  ON public.category_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage category content" ON public.category_content;
CREATE POLICY "Admins can manage category content"
  ON public.category_content FOR ALL TO authenticated
  USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());


-- ─── Seed: Hermetismo ────────────────────────────────────────────
INSERT INTO public.category_content (category, desc_col1_html, desc_col2_html, timeline, figures)
VALUES (
  'hermetismo',
  '<div class="desc-heading">ORIGEM E CONTEXTO</div>
<div class="desc-body">
  <p>O Hermetismo nasce no Egito helenístico, entre os séculos I e III d.C., com um conjunto de textos atribuídos a <strong>Hermes Trismegisto</strong> — "três vezes grande" — uma figura mítica que fundia o deus egípcio Thoth com o grego Hermes.</p>
  <p>O <strong>Corpus Hermeticum</strong>, redescoberto no séc. XV por Cosimo de Médici, causou um terremoto intelectual no Renascimento. Ficino o traduziu antes de Platão — tal era a urgência.</p>
  <p>A premissa central é elegante e perturbadora: o universo é de natureza <strong>mental</strong>. A realidade que percebemos é o pensamento de uma mente cósmica — e a nossa mente é um fragmento dessa mesma substância.</p>
</div>',
  '<div class="desc-heading">OS SETE PRINCÍPIOS</div>
<div class="desc-body">
  <p>O Kybalion — publicado em 1908 por "Três Iniciados" — sistematiza os ensinamentos herméticos em sete leis que governam toda a existência:</p>
  <p><strong>Mentalismo</strong> · O Todo é Mente.<br>
  <strong>Correspondência</strong> · Como acima, assim abaixo.<br>
  <strong>Vibração</strong> · Nada está em repouso.<br>
  <strong>Polaridade</strong> · Tudo tem dois polos.<br>
  <strong>Ritmo</strong> · Tudo flui e reflui.<br>
  <strong>Causa e Efeito</strong> · Nada é acidente.<br>
  <strong>Gênero</strong> · O gênero está em tudo.</p>
  <p>Estes princípios não são metáforas — são, para o hermético, a estrutura literal do real.</p>
</div>',
  '[
    {"date":"Séc. III a.C.","title":"THOTH E HERMES SE FUNDEM","desc":"No Egito helenístico, o deus da sabedoria egípcio Thoth é identificado com o grego Hermes. Nasce a figura de Hermes Trismegisto — \"três vezes grande\".","key":true},
    {"date":"Séc. I–III d.C.","title":"CORPUS HERMETICUM É ESCRITO","desc":"Os textos herméticos são compostos em Alexandria. O Poimandres — visão da criação — e a Asclepius formam o núcleo da tradição. A Tábua de Esmeralda circula como texto independente.","key":true},
    {"date":"Séc. IX","title":"TRADIÇÃO ÁRABE","desc":"Alquimistas árabes, especialmente Jabir ibn Hayyan, incorporam o hermetismo à química experimental. A Tábua de Esmeralda é preservada em traduções árabes.","key":false},
    {"date":"1463","title":"RENASCIMENTO HERMÉTICO","desc":"Cosimo de Médici manda Marsilio Ficino traduzir o Corpus Hermeticum antes de completar Platão. O hermetismo explode no Renascimento italiano.","key":true},
    {"date":"Séc. XVII","title":"ROSACRUZ E MAÇONARIA","desc":"Os manifestos Rosacruzes e a maçonaria especulativa emergente absorvem profundamente o simbolismo hermético. A alquimia hermética transita do laboratório para o ritual iniciático.","key":false},
    {"date":"1908","title":"O KYBALION","desc":"Publicado pelos misteriosos \"Três Iniciados\", o Kybalion sistematiza os sete princípios herméticos numa linguagem moderna. Torna-se o texto introdutório mais influente da tradição ocidental.","key":true},
    {"date":"Séc. XX","title":"JUNG E A PSICOLOGIA HERMÉTICA","desc":"Carl Jung dedica décadas ao estudo da alquimia hermética, reconhecendo nela um mapa preciso da psique. Seu trabalho ressignifica o hermetismo para o pensamento moderno.","key":false}
  ]',
  '[
    {"symbol":"☿","name":"HERMES TRISMEGISTO","period":"Mítico · Egito Helenístico","desc":"Figura semi-divina que funde Thoth e Hermes. Autor mítico do Corpus Hermeticum e da Tábua de Esmeralda. \"Três vezes grande\" — sacerdote, filósofo e rei."},
    {"symbol":"✦","name":"MARSILIO FICINO","period":"1433–1499 · Florença","desc":"Tradutor do Corpus Hermeticum para o latim. Fundador da Academia Platônica de Florença. Responsável pela ressurreição do hermetismo no Renascimento europeu."},
    {"symbol":"◈","name":"GIORDANO BRUNO","period":"1548–1600 · Nápoles","desc":"Filósofo e hermetista que defendeu um universo infinito habitado por mundos incontáveis. Queimado pela Inquisição em 1600 — mártir do pensamento livre."},
    {"symbol":"△","name":"PARACELSO","period":"1493–1541 · Suíça","desc":"Médico e alquimista que fundiu hermetismo com medicina. Desenvolveu a doutrina das assinaturas — a ideia de que a natureza revela seus poderes através da forma."},
    {"symbol":"∞","name":"TRÊS INICIADOS","period":"1908 · Identidade desconhecida","desc":"Autores anônimos do Kybalion. Sua identidade nunca foi confirmada — especula-se William Walker Atkinson. Sistematizaram o hermetismo para o séc. XX."},
    {"symbol":"⊕","name":"CARL GUSTAV JUNG","period":"1875–1961 · Suíça","desc":"Psicólogo que reconheceu no hermetismo e na alquimia um mapa do inconsciente. Seus volumes sobre Psicologia e Alquimia são leitura essencial para qualquer estudante sério."},
    {"symbol":"☽","name":"MANLY P. HALL","period":"1901–1990 · EUA","desc":"Autor de \"The Secret Teachings of All Ages\" — enciclopédia monumental dos ensinamentos ocultos. Uma das sínteses mais abrangentes do hermetismo, Cabala e filosofia perene."}
  ]'
)
ON CONFLICT (category) DO UPDATE SET
  desc_col1_html = EXCLUDED.desc_col1_html,
  desc_col2_html = EXCLUDED.desc_col2_html,
  timeline = EXCLUDED.timeline,
  figures = EXCLUDED.figures,
  updated_at = now();


-- ─── Seed: Cabala ────────────────────────────────────────────────
INSERT INTO public.category_content (category, desc_col1_html, desc_col2_html, timeline, figures)
VALUES (
  'cabala',
  '<div class="desc-heading">ORIGEM E CONTEXTO</div>
<div class="desc-body">
  <p>A Cabala é a tradição mística do judaísmo, desenvolvida sobretudo a partir do séc. XII na Provence e na Espanha. Seu nome vem do hebraico <strong>קַבָּלָה</strong> — "recepção" ou "tradição recebida".</p>
  <p>Seu texto central, o <strong>Zohar</strong>, atribuído ao rabino Shimon bar Yochai mas provavelmente escrito por Moisés de Leão no séc. XIII, é uma vastidão de comentários místicos sobre a Torá.</p>
  <p>A <strong>Árvore da Vida</strong> — o mapa das dez sefirot e os 22 caminhos que as conectam — tornou-se o símbolo mais reconhecível da Cabala e a base de muito do esoterismo ocidental posterior.</p>
</div>',
  '<div class="desc-heading">AS DEZ SEFIROT</div>
<div class="desc-body">
  <p>As Sefirot são os dez atributos divinos através dos quais o Ein Sof (o Infinito) se manifesta no mundo criado:</p>
  <p><strong>Kether</strong> · A Coroa — a vontade divina primordial.<br>
  <strong>Chokhmah</strong> · A Sabedoria — o primeiro lampejo do intelecto.<br>
  <strong>Binah</strong> · A Inteligência — a compreensão que dá forma.<br>
  <strong>Chesed</strong> · A Misericórdia — a graça expansiva.<br>
  <strong>Geburah</strong> · A Força — o rigor que limita.<br>
  <strong>Tiferet</strong> · A Beleza — o equilíbrio do coração.<br>
  <strong>Netzach</strong> · A Vitória — a emoção e o desejo.<br>
  <strong>Hod</strong> · O Esplendor — a mente concreta.<br>
  <strong>Yesod</strong> · O Fundamento — o inconsciente.<br>
  <strong>Malkuth</strong> · O Reino — o mundo manifestado.</p>
</div>',
  '[
    {"date":"Séc. I–II d.C.","title":"TEXTOS FUNDADORES","desc":"O Sefer Yetzirah (Livro da Formação) e o Sefer Bahir são compostos. Eles estabelecem a especulação sobre as letras hebraicas e os primeiros conceitos das sefirot.","key":true},
    {"date":"Séc. XII","title":"PROVENCE E CATALUNHA","desc":"A tradição cabalística emerge na Provence francesa e na Catalunha espanhola. O conceito de Ein Sof (o Infinito) é articulado pela primeira vez.","key":true},
    {"date":"1280","title":"O ZOHAR","desc":"Moisés de Leão publica o Zohar em Castela, atribuindo-o ao rabino Shimon bar Yochai do séc. II. Torna-se o texto sagrado central da Cabala.","key":true},
    {"date":"Séc. XVI","title":"SAFED — O RENASCIMENTO CABALÍSTICO","desc":"A cidade de Safed, em Galileia, torna-se o centro mundial da Cabala. Isaac Luria (o Ari) desenvolve a Cabala Luriana — com as doutrinas do Tzimtzum, Shevirat HaKelim e Tikkun.","key":true},
    {"date":"Séc. XVII–XVIII","title":"CABALA CRISTÃ","desc":"Giovanni Pico della Mirandola e depois Johannes Reuchlin adaptam a Cabala ao cristianismo. A tradição é absorvida pelo esoterismo renascentista e maçônico.","key":false},
    {"date":"Séc. XIX–XX","title":"CABALA HERMÉTICA","desc":"A Ordem Hermética da Aurora Dourada sintetiza Cabala, Tarot, astrologia e magia. Mathers, Crowley e depois Dion Fortune popularizam a \"Cabala Ocidental\".","key":false}
  ]',
  '[
    {"symbol":"✡","name":"MOISÉS DE LEÃO","period":"1240–1305 · Castela","desc":"Autor provável do Zohar, o texto sagrado central da Cabala. Publicou a obra atribuindo-a ao Rashbi — o rabino Shimon bar Yochai — para conferir-lhe autoridade ancestral."},
    {"symbol":"◉","name":"ISAAC LURIA (O ARI)","period":"1534–1572 · Safed","desc":"O maior cabalista da era moderna. Desenvolveu a Cabala Luriana com os conceitos de Tzimtzum (contração divina), Shevirat HaKelim (quebra dos vasos) e Tikkun (restauração)."},
    {"symbol":"△","name":"GIOVANNI PICO DELLA MIRANDOLA","period":"1463–1494 · Florença","desc":"Humanista italiano que fundou a Cabala Cristã. Estudou hebraico e argumentou que nenhuma ciência prova a divindade de Cristo mais do que a Cabala."},
    {"symbol":"✦","name":"DION FORTUNE","period":"1890–1946 · Reino Unido","desc":"Ocultista e escritora que popularizou a Cabala Hermética ocidental. Seu livro \"A Cabala Mística\" é ainda hoje o texto introdutório mais acessível da tradição."},
    {"symbol":"⊕","name":"ARYEH KAPLAN","period":"1934–1983 · EUA","desc":"Rabino e físico que traduziu textos cabalísticos clássicos para o inglês com rigor acadêmico e profundidade espiritual. Tornou a Cabala autêntica acessível ao mundo moderno."}
  ]'
)
ON CONFLICT (category) DO UPDATE SET
  desc_col1_html = EXCLUDED.desc_col1_html,
  desc_col2_html = EXCLUDED.desc_col2_html,
  timeline = EXCLUDED.timeline,
  figures = EXCLUDED.figures,
  updated_at = now();


-- ─── Seed: Gnosticismo ──────────────────────────────────────────
INSERT INTO public.category_content (category, desc_col1_html, desc_col2_html, timeline, figures)
VALUES (
  'gnosticismo',
  '<div class="desc-heading">ORIGEM E CONTEXTO</div>
<div class="desc-body">
  <p>O Gnosticismo é um conjunto de movimentos religiosos e filosóficos do séc. I ao IV d.C., caracterizados pela busca da <strong>gnose</strong> — o conhecimento direto, experiencial, do divino.</p>
  <p>Os gnósticos ensinavam que o mundo material foi criado por um deus inferior e ignorante — o <strong>Demiurgo</strong> — e não pelo Deus supremo. A centelha divina aprisionada no ser humano ansia por retornar à sua fonte.</p>
  <p>A descoberta da <strong>Biblioteca de Nag Hammadi</strong> em 1945 revolucionou o estudo do gnosticismo, revelando textos que a Igreja havia suprimido por séculos.</p>
</div>',
  '<div class="desc-heading">OS GRANDES SISTEMAS</div>
<div class="desc-body">
  <p>O gnosticismo não foi um movimento único, mas uma constelação de tradições. Os principais sistemas incluem:</p>
  <p><strong>Valentinianismo</strong> · O sistema mais sofisticado, desenvolvido por Valentino de Alexandria. Ensina uma cadeia de éons emanados do Pleroma (a Plenitude divina).</p>
  <p><strong>Sethianismo</strong> · Centra-se em Set, terceiro filho de Adão, como ancestral espiritual dos gnósticos. Inclui textos como o Apocalipse de Adão e o Evangelho dos Egípcios.</p>
  <p><strong>Maniqueísmo</strong> · Fundado por Mani no séc. III, fundiu elementos cristãos, zoroastrianos e budistas numa visão dualista radical de luz versus trevas.</p>
  <p><strong>Mandaeísmo</strong> · A única seita gnóstica ainda viva, com comunidades no Iraque e Irã. Venera João Batista e rejeita Jesus.</p>
</div>',
  '[
    {"date":"Séc. I d.C.","title":"ORIGENS EM ALEXANDRIA","desc":"O gnosticismo emerge em Alexandria, Egito — cruzamento de tradições judaicas, gregas, egípcias e persas. Simão Mago é mencionado como uma das primeiras figuras gnósticas.","key":true},
    {"date":"140–180 d.C.","title":"VALENTINO E O ÁPICE","desc":"Valentino de Alexandria desenvolve o sistema gnóstico mais elaborado. Ensina em Roma e quase se torna bispo. Seu sistema dos trinta éons e a queda de Sophia é o cume intelectual do movimento.","key":true},
    {"date":"180 d.C.","title":"IRENEO CONTRA OS GNÓSTICOS","desc":"Ireneo de Lyon escreve \"Adversus Haereses\" — o primeiro grande ataque sistêmico ao gnosticismo. O texto paradoxalmente preserva detalhes que de outro modo seriam perdidos.","key":false},
    {"date":"240–280 d.C.","title":"MANI E O MANIQUEÍSMO","desc":"Mani proclama sua religião universal fundindo gnosticismo, zoroastrismo e budismo. O Maniqueísmo se expande do Mediterrâneo à China, tornando-se a maior religião gnóstica da história.","key":true},
    {"date":"1945","title":"NAG HAMMADI","desc":"Um camponês egípcio descobre uma jarra contendo 13 códices com 52 textos gnósticos no Egito. O Evangelho de Tomé, o Evangelho da Verdade e outros textos perdidos são revelados ao mundo.","key":true},
    {"date":"1978–presente","title":"RENASCIMENTO ACADÊMICO","desc":"A publicação em inglês dos textos de Nag Hammadi (1977) inaugura uma nova era de estudo. Elaine Pagels populariza o gnosticismo com \"Os Evangelhos Gnósticos\" (1979), best-seller mundial.","key":false}
  ]',
  '[
    {"symbol":"⊕","name":"VALENTINO","period":"100–180 d.C. · Alexandria/Roma","desc":"O maior teólogo gnóstico. Seu sistema dos trinta éons, a queda de Sophia e a criação do mundo pelo Demiurgo ignorante é a obra-prima intelectual do movimento gnóstico."},
    {"symbol":"◈","name":"BASÍLIDES","period":"Séc. II d.C. · Alexandria","desc":"Gnóstico alexandrino que ensinou um deus supremo inominável — o Abraxas — e uma cadeia de 365 éons. Seu sistema influenciou profundamente o desenvolvimento posterior do gnosticismo."},
    {"symbol":"☿","name":"MANI","period":"216–274 d.C. · Pérsia","desc":"Fundador do Maniqueísmo. Proclamou-se o \"Paráclito\" prometido por Jesus. Seu sistema dualista de Luz e Trevas se espalhou pelo mundo antigo — e chegou a converter Agostinho."},
    {"symbol":"✦","name":"ELAINE PAGELS","period":"1943–presente · EUA","desc":"Estudiosa que tornou o gnosticismo acessível ao público moderno. \"Os Evangelhos Gnósticos\" (1979) ganhou o National Book Award e mudou a conversa pública sobre o cristianismo primitivo."},
    {"symbol":"△","name":"CARL SCHMIDT","period":"1868–1938 · Alemanha","desc":"Coptologo alemão que foi o primeiro a traduzir e publicar textos gnósticos do Egito no séc. XX, preparando o terreno para a grande descoberta de Nag Hammadi."}
  ]'
)
ON CONFLICT (category) DO UPDATE SET
  desc_col1_html = EXCLUDED.desc_col1_html,
  desc_col2_html = EXCLUDED.desc_col2_html,
  timeline = EXCLUDED.timeline,
  figures = EXCLUDED.figures,
  updated_at = now();


-- ─── Seed: Alquimia ─────────────────────────────────────────────
INSERT INTO public.category_content (category, desc_col1_html, desc_col2_html, timeline, figures)
VALUES (
  'alquimia',
  '<div class="desc-heading">ORIGEM E CONTEXTO</div>
<div class="desc-body">
  <p>A Alquimia nasceu na Alexandria helenística como uma síntese de filosofia grega, magia egípcia e astrologia babilônica. O nome vem do árabe <strong>al-kīmiyā</strong>, possivelmente do grego <strong>Khemia</strong> — "a arte egípcia".</p>
  <p>Durante a Idade Média e o Renascimento, a alquimia era a ciência dos sciencias — a tentativa de compreender a natureza profunda da matéria e da alma. Isaac Newton dedicou mais tempo à alquimia do que à física.</p>
  <p>O objetivo declarado era a transmutação dos metais e a criação da <strong>Pedra Filosofal</strong>. O objetivo velado, para os adeptos, era a transmutação da alma — a Grande Obra interior.</p>
</div>',
  '<div class="desc-heading">AS QUATRO ETAPAS</div>
<div class="desc-body">
  <p>A Grande Obra alquímica se divide em quatro fases, cada uma com sua cor e simbolismo:</p>
  <p><strong>Nigredo</strong> · O Enegrecimento. A putrefação, a dissolução, a morte do eu superficial. O início necessário de toda transformação genuína.</p>
  <p><strong>Albedo</strong> · O Embranquecimento. A purificação após a morte. A separação do puro do impuro. O surgimento da consciência mais clara.</p>
  <p><strong>Citrinitas</strong> · O Amarelecimento. A iluminação, o alvorecer da sabedoria. Frequentemente omitido nos textos tardios.</p>
  <p><strong>Rubedo</strong> · O Avermelhamento. A completude, a conjunção dos opostos, a criação da Pedra Filosofal. O ser transmutado.</p>
</div>',
  '[
    {"date":"Séc. I–III d.C.","title":"ALQUIMIA ALEXANDRINA","desc":"Zósimos de Panópolis escreve os primeiros textos alquímicos reconhecíveis. A alquimia surge como síntese de filosofia hermética, magia prática e metalurgia egípcia em Alexandria.","key":true},
    {"date":"Séc. VIII–IX","title":"ALQUIMIA ÁRABE","desc":"Jabir ibn Hayyan (Geber) desenvolve a teoria dos metais baseada nos quatro elementos. Introduz o método experimental sistemático e cria novos compostos químicos.","key":true},
    {"date":"Séc. XII","title":"TRADUÇÃO PARA O LATIM","desc":"Os textos árabes são traduzidos para o latim na Espanha e Sicília. A alquimia europeia nasce. Albertus Magnus e Roger Bacon são pioneiros.","key":false},
    {"date":"Séc. XIV–XV","title":"NICOLAS FLAMEL","desc":"O copista parisiense Nicolas Flamel afirma ter alcançado a transmutação do ouro. Sua história — seja real ou lendária — se torna a narrativa alquímica mais famosa do Ocidente.","key":true},
    {"date":"Séc. XVI","title":"PARACELSO REVOLUCIONA","desc":"Paracelso rejeita os quatro elementos aristotélicos e propõe Sal, Enxofre e Mercúrio. Transforma a alquimia numa medicina espiritual — a iatroquímica.","key":true},
    {"date":"Séc. XVII","title":"A GRANDE BIFURCAÇÃO","desc":"A alquimia se divide: Robert Boyle e outros fundam a química moderna. A corrente espiritual continua nos Rosacruzes e mais tarde na maçonaria especulativa.","key":false},
    {"date":"1944","title":"JUNG E A ALQUIMIA","desc":"Carl Jung publica \"Psicologia e Alquimia\", demonstrando que as imagens alquímicas são símbolos do processo de individuação. A alquimia ganha nova vida como psicologia profunda.","key":true}
  ]',
  '[
    {"symbol":"☽","name":"ZÓSIMOS DE PANÓPOLIS","period":"Séc. III–IV d.C. · Egito","desc":"O primeiro alquimista cujos textos sobreviveram. Seus escritos fundem técnica metalúrgica com visões místicas e herméticas. Descreve visões de transformação que antecipam Jung por 1700 anos."},
    {"symbol":"△","name":"PARACELSO","period":"1493–1541 · Suíça","desc":"Médico, alquimista e mago. Queimou os livros de Galeno em público. Introduziu o uso de minerais na medicina, criou a iatroquímica e reinterpretou a alquimia como ciência do espírito."},
    {"symbol":"◈","name":"NICOLAS FLAMEL","period":"1330–1418 · Paris","desc":"O mais famoso alquimista do Ocidente — seja por feitos reais ou por uma lenda construída após sua morte. Sua suposta transmutação e o \"Livro de Abraham o Judeu\" moldaram toda a alquimia europeia posterior."},
    {"symbol":"☿","name":"ISAAC NEWTON","period":"1643–1727 · Inglaterra","desc":"O maior físico da história dedicou mais anos à alquimia do que à física. Seus manuscritos alquímicos — suprimidos até o séc. XX — revelam uma visão de mundo profundamente hermética."},
    {"symbol":"✦","name":"CARL GUSTAV JUNG","period":"1875–1961 · Suíça","desc":"Ressignificou a alquimia como linguagem do inconsciente. Passou décadas decodificando textos alquímicos como mapas da psique. \"Psicologia e Alquimia\" é sua obra-prima."}
  ]'
)
ON CONFLICT (category) DO UPDATE SET
  desc_col1_html = EXCLUDED.desc_col1_html,
  desc_col2_html = EXCLUDED.desc_col2_html,
  timeline = EXCLUDED.timeline,
  figures = EXCLUDED.figures,
  updated_at = now();


-- ─── Seed: Tarot ────────────────────────────────────────────────
INSERT INTO public.category_content (category, desc_col1_html, desc_col2_html, timeline, figures)
VALUES (
  'tarot',
  '<div class="desc-heading">ORIGEM E CONTEXTO</div>
<div class="desc-body">
  <p>O Tarot surgiu no norte da Itália no séc. XV como jogo de cartas aristocrático — os <strong>Trionfi</strong>. A conexão com o esoterismo só surgiu no séc. XVIII, quando Antoine Court de Gébelin afirmou que as cartas eram o "Livro de Thoth" perdido.</p>
  <p>Esta teoria é historicamente incorreta — mas esoterickamente fértil. Os ocultistas do séc. XIX reorganizaram o Tarot em torno da Cabala, associando cada carta do <strong>Arcano Maior</strong> a uma letra hebraica e um caminho da Árvore da Vida.</p>
  <p>O <strong>Tarot Rider-Waite-Smith</strong> (1909), desenhado por Pamela Colman Smith sob orientação de Arthur Edward Waite, é o deck mais influente da história e a base da maioria dos decks modernos.</p>
</div>',
  '<div class="desc-heading">ESTRUTURA E SIMBOLISMO</div>
<div class="desc-body">
  <p>O Tarot completo tem 78 cartas divididas em dois grupos:</p>
  <p><strong>Arcanos Maiores</strong> (22 cartas): Do Louco (0) ao Mundo (XXI). Representam os grandes arquétipos da jornada humana — da inconsciência (O Louco) à integração completa (O Mundo).</p>
  <p><strong>Arcanos Menores</strong> (56 cartas): Quatro naipes — Copas (água, emoções), Paus (fogo, vontade), Espadas (ar, intelecto) e Ouros (terra, matéria). Cada naipe tem 14 cartas: Ás ao 10, mais Pajem, Cavaleiro, Rainha e Rei.</p>
  <p>Na Cabala Hermética, os Arcanos Maiores correspondem aos 22 caminhos da Árvore da Vida e às 22 letras do alfabeto hebraico.</p>
</div>',
  '[
    {"date":"1440–1450","title":"OS PRIMEIROS DECKS","desc":"Os Trionfi surgem no norte da Itália — Milão, Ferrara, Bolonha. O Visconti-Sforza, encomendado pelo duque de Milão, é o deck mais antigo a sobreviver razoavelmente completo.","key":true},
    {"date":"1781","title":"COURT DE GÉBELIN","desc":"Antoine Court de Gébelin publica sua teoria de que o Tarot é o \"Livro de Thoth\" egípcio. Historicamente absurda, esta teoria inaugura o Tarot esotérico e muda a história do baralho para sempre.","key":true},
    {"date":"1854","title":"ÉLIPHAS LÉVI E A CABALA","desc":"Éliphas Lévi conecta sistematicamente o Tarot com a Cabala, associando os 22 Arcanos Maiores às 22 letras hebraicas. Esta síntese torna-se o fundamento da tradição esotérica ocidental.","key":true},
    {"date":"1888","title":"GOLDEN DAWN","desc":"A Ordem Hermética da Aurora Dourada adota o Tarot como ferramenta central de trabalho mágico, junto com a Cabala, astrologia e alquimia. MacGregor Mathers cria um sistema de correspondências detalhado.","key":false},
    {"date":"1909","title":"RIDER-WAITE-SMITH","desc":"Arthur Edward Waite e a artista Pamela Colman Smith publicam o deck Rider-Waite. Pela primeira vez, todos os 78 cartas têm cenas figurativas completas. Torna-se o deck mais influente de todos os tempos.","key":true},
    {"date":"1944","title":"THOTH TAROT DE CROWLEY","desc":"Aleister Crowley e a artista Lady Frieda Harris completam o Thoth Tarot, incorporando geometria projetiva e hermetismo avançado. Publicado postumamente em 1969, torna-se o segundo deck mais influente.","key":true}
  ]',
  '[
    {"symbol":"⊗","name":"PAMELA COLMAN SMITH","period":"1878–1951 · EUA/Reino Unido","desc":"A artista que desenhou o Rider-Waite Tarot. Membro da Golden Dawn, Smith recebeu orientações de Waite mas trouxe sua própria visão artística e espiritual. Morreu na pobreza, sem reconhecimento."},
    {"symbol":"△","name":"ARTHUR EDWARD WAITE","period":"1857–1942 · EUA/Reino Unido","desc":"Ocultista, pesquisador e membro da Golden Dawn. Criou o sistema que associa cada Arcano Maior a conceitos cabalísticos específicos. Seu \"A Chave Pictórica do Tarot\" é o texto de referência clássico."},
    {"symbol":"◈","name":"ALEISTER CROWLEY","period":"1875–1947 · Reino Unido","desc":"O mais controverso ocultista do séc. XX criou o Thoth Tarot — uma síntese monumental de astrologia, Thelema e geometria sagrada. Amado e odiado em igual medida."},
    {"symbol":"☿","name":"ÉLIPHAS LÉVI","period":"1810–1875 · Paris","desc":"O pai do ocultismo moderno. Sua síntese de Cabala, Tarot e magia em \"Dogma e Ritual da Alta Magia\" fundou a tradição que a Golden Dawn herdaria e desenvolveria."},
    {"symbol":"✦","name":"RACHEL POLLACK","period":"1945–2023 · EUA","desc":"A maior escritora de Tarot do séc. XX. Seu \"78 Degrees of Wisdom\" é considerado o melhor livro sobre Tarot já escrito. Trouxe profundidade psicológica e perspectiva feminina à tradição."}
  ]'
)
ON CONFLICT (category) DO UPDATE SET
  desc_col1_html = EXCLUDED.desc_col1_html,
  desc_col2_html = EXCLUDED.desc_col2_html,
  timeline = EXCLUDED.timeline,
  figures = EXCLUDED.figures,
  updated_at = now();


-- ─── Seed: Rosacruz ─────────────────────────────────────────────
INSERT INTO public.category_content (category, desc_col1_html, desc_col2_html, timeline, figures)
VALUES (
  'rosacruz',
  '<div class="desc-heading">ORIGEM E CONTEXTO</div>
<div class="desc-body">
  <p>A Rosacruz — ou Rosacrucianismo — é uma tradição esotérica que emergiu publicamente na Europa do séc. XVII com a publicação de três manifestos anônimos: a <strong>Fama Fraternitatis</strong> (1614), a <strong>Confessio Rosae Crucis</strong> (1615) e as <strong>Bodas Químicas de Christian Rosenkreuz</strong> (1616).</p>
  <p>Os manifestos descrevem uma fraternidade secreta de sábios liderada pelo misterioso <strong>Christian Rosenkreuz</strong>, que teria aprendido sabedoria esotérica no Oriente e fundado uma irmandade para reformar a humanidade.</p>
  <p>Se a Fraternidade da Rosacruz existiu de fato ou foi uma ficção filosófica é um mistério intencional — talvez o mais elegante da história esotérica.</p>
</div>',
  '<div class="desc-heading">O SIMBOLISMO CENTRAL</div>
<div class="desc-body">
  <p>O símbolo da Rosacruz — a rosa sobre a cruz — condensa a essência da tradição:</p>
  <p>A <strong>Cruz</strong> representa o mundo material, o sofrimento, o sacrifício. Os quatro braços apontam para os quatro elementos, os quatro pontos cardeais, a extensão do ser no tempo e no espaço.</p>
  <p>A <strong>Rosa</strong> representa o despertar espiritual, a alma em florescimento, a beleza que emerge do sofrimento. No centro da cruz — o coração do mundo material — a rosa floresce.</p>
  <p>A síntese: <strong>o espiritual que floresce dentro do material</strong>. Não a fuga do mundo, mas sua transfiguração.</p>
  <p>Esta visão influenciou diretamente a maçonaria especulativa, a Golden Dawn, a Antroposofia de Rudolf Steiner e inúmeras outras tradições.</p>
</div>',
  '[
    {"date":"1614–1616","title":"OS TRÊS MANIFESTOS","desc":"A Fama Fraternitatis, a Confessio Rosae Crucis e as Bodas Químicas de Christian Rosenkreuz são publicados na Alemanha. Causam sensação em toda a Europa culta — centenas de respostas são publicadas.","key":true},
    {"date":"1623","title":"PÂNICO EM PARIS","desc":"Cartazes anônimos são fixados em Paris anunciando a chegada dos Rosacruzes. O pânico se espalha — a Fraternidade invisível parece estar em toda parte. Ninguém se apresenta.","key":true},
    {"date":"Séc. XVII–XVIII","title":"INFLUÊNCIA NA MAÇONARIA","desc":"O simbolismo rosacruz penetra profundamente na maçonaria especulativa emergente. Os graus superiores dos ritos maçônicos incorporam explicitamente a iconografia e os ensinamentos rosacruzes.","key":false},
    {"date":"1888","title":"GOLDEN DAWN","desc":"A Ordem Hermética da Aurora Dourada adota o rosacrucianismo como parte central de seu sistema. Os graus mais elevados (Adeptus Minor em diante) são explicitamente rosacruzes.","key":true},
    {"date":"1909","title":"MAX HEINDEL E A FRATERNIDADE ROSACRUZ","desc":"Max Heindel funda a Fraternidade Rosacruz na Califórnia e publica \"O Conceito Rosacruz do Cosmos\" — uma síntese de rosacrucianismo com teosofia e esoterismo cristão.","key":false},
    {"date":"1915","title":"AMORC","description":"A Antiga e Mística Ordem Rosae Crucis (AMORC) é fundada por Harvey Spencer Lewis nos EUA. Torna-se a maior organização rosacruz do mundo, com membros em dezenas de países.","key":false}
  ]',
  '[
    {"symbol":"△","name":"CHRISTIAN ROSENKREUZ","period":"Mítico · 1378–1484","desc":"O fundador lendário da Fraternidade Rosacruz. Teria vivido 106 anos, viajado ao Oriente, aprendido sabedoria esotérica e fundado a Irmandade. Seu túmulo, descoberto 120 anos após a morte, é descrito em detalhes vívidos."},
    {"symbol":"◈","name":"JOHANN VALENTIN ANDREAE","period":"1586–1654 · Württemberg","desc":"Teólogo alemão considerado o autor mais provável das Bodas Químicas e talvez dos outros manifestos. Descreveu os textos como uma \"brincadeira\" — mas sua influência foi absolutamente séria."},
    {"symbol":"☿","name":"ROBERT FLUDD","period":"1574–1637 · Inglaterra","desc":"Médico e filósofo inglês que publicamente defendeu a Fraternidade Rosacruz quando ninguém mais ousava. Suas obras ilustradas sintetizam hermetismo, cabala e rosacrucianismo numa filosofia visionária."},
    {"symbol":"✦","name":"RUDOLF STEINER","period":"1861–1925 · Áustria","desc":"Filósofo e ocultista que fundou a Antroposofia após romper com a Teosofia. Incorporou profundamente o simbolismo rosacruz em seu sistema — via a Rosacruz como a forma de esoterismo adequada à era moderna."},
    {"symbol":"△","name":"A. E. WAITE","period":"1857–1942 · Reino Unido","desc":"Pesquisador que escreveu a história mais abrangente da Fraternidade Rosacruz em inglês. Fundou a Independent and Rectified Rite, um grupo com forte coloração rosacruz dentro da tradição maçônica."}
  ]'
)
ON CONFLICT (category) DO UPDATE SET
  desc_col1_html = EXCLUDED.desc_col1_html,
  desc_col2_html = EXCLUDED.desc_col2_html,
  timeline = EXCLUDED.timeline,
  figures = EXCLUDED.figures,
  updated_at = now();
