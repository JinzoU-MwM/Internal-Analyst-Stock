// Curated list of popular IDX stocks for autocomplete
// Format: { ticker, name }
const IDX_STOCKS = [
    // Big 4 Banks
    { ticker: "BBCA", name: "Bank Central Asia" },
    { ticker: "BBRI", name: "Bank Rakyat Indonesia" },
    { ticker: "BMRI", name: "Bank Mandiri" },
    { ticker: "BBNI", name: "Bank Negara Indonesia" },
    // Other Banks
    { ticker: "BRIS", name: "Bank Syariah Indonesia" },
    { ticker: "BTPS", name: "Bank BTPN Syariah" },
    { ticker: "NISP", name: "Bank OCBC NISP" },
    { ticker: "BDMN", name: "Bank Danamon" },
    { ticker: "MEGA", name: "Bank Mega" },
    { ticker: "BNGA", name: "Bank CIMB Niaga" },
    { ticker: "BNLI", name: "Bank Permata" },
    { ticker: "BBTN", name: "Bank Tabungan Negara" },
    { ticker: "BJTM", name: "Bank Jatim" },
    // Telco
    { ticker: "TLKM", name: "Telkom Indonesia" },
    { ticker: "EXCL", name: "XL Axiata" },
    { ticker: "ISAT", name: "Indosat Ooredoo" },
    { ticker: "TOWR", name: "Sarana Menara Nusantara" },
    { ticker: "TBIG", name: "Tower Bersama" },
    // Mining
    { ticker: "ADRO", name: "Adaro Energy" },
    { ticker: "ITMG", name: "Indo Tambangraya Megah" },
    { ticker: "PTBA", name: "Bukit Asam" },
    { ticker: "INDY", name: "Indika Energy" },
    { ticker: "ANTM", name: "Aneka Tambang" },
    { ticker: "TINS", name: "Timah" },
    { ticker: "INCO", name: "Vale Indonesia" },
    { ticker: "MDKA", name: "Merdeka Copper Gold" },
    { ticker: "HRUM", name: "Harum Energy" },
    { ticker: "BUMI", name: "Bumi Resources" },
    // Property
    { ticker: "BSDE", name: "Bumi Serpong Damai" },
    { ticker: "CTRA", name: "Ciputra Development" },
    { ticker: "SMRA", name: "Summarecon Agung" },
    { ticker: "PWON", name: "Pakuwon Jati" },
    { ticker: "DILD", name: "Intiland Development" },
    // Consumer Goods
    { ticker: "ICBP", name: "Indofood CBP" },
    { ticker: "INDF", name: "Indofood Sukses Makmur" },
    { ticker: "UNVR", name: "Unilever Indonesia" },
    { ticker: "MYOR", name: "Mayora Indah" },
    { ticker: "KLBF", name: "Kalbe Farma" },
    { ticker: "SIDO", name: "Industri Jamu Sido Muncul" },
    { ticker: "HMSP", name: "HM Sampoerna" },
    { ticker: "GGRM", name: "Gudang Garam" },
    // Automotive & Manufacturing
    { ticker: "ASII", name: "Astra International" },
    { ticker: "AUTO", name: "Astra Otoparts" },
    { ticker: "SMSM", name: "Selamat Sempurna" },
    // Infrastructure & Energy
    { ticker: "PGAS", name: "Perusahaan Gas Negara" },
    { ticker: "JSMR", name: "Jasa Marga" },
    { ticker: "WIKA", name: "Wijaya Karya" },
    { ticker: "PTPP", name: "PP Persero" },
    { ticker: "WSKT", name: "Waskita Karya" },
    { ticker: "AKRA", name: "AKR Corporindo" },
    { ticker: "MEDC", name: "Medco Energi" },
    // Cement & Building Materials
    { ticker: "SMGR", name: "Semen Indonesia" },
    { ticker: "INTP", name: "Indocement Tunggal Prakarsa" },
    // Retail & Trade
    { ticker: "ACES", name: "Ace Hardware Indonesia" },
    { ticker: "AMRT", name: "Sumber Alfaria Trijaya" },
    { ticker: "MAPI", name: "Mitra Adiperkasa" },
    { ticker: "LPPF", name: "Matahari Department Store" },
    { ticker: "ERAA", name: "Erajaya Swasembada" },
    // Technology & Media
    { ticker: "EMTK", name: "Elang Mahkota Teknologi" },
    { ticker: "SCMA", name: "Surya Citra Media" },
    { ticker: "GOTO", name: "GoTo Gojek Tokopedia" },
    { ticker: "BUKA", name: "Bukalapak" },
    { ticker: "DCII", name: "DCI Indonesia" },
    // Healthcare
    { ticker: "HEAL", name: "Medikaloka Hermina" },
    { ticker: "SILO", name: "Siloam International Hospitals" },
    // Poultry & Agri
    { ticker: "JPFA", name: "Japfa Comfeed" },
    { ticker: "CPIN", name: "Charoen Pokphand" },
    { ticker: "MAIN", name: "Malindo Feedmill" },
    { ticker: "LSIP", name: "London Sumatra" },
    { ticker: "AALI", name: "Astra Agro Lestari" },
    // Heavy Industry
    { ticker: "UNTR", name: "United Tractors" },
    { ticker: "BYAN", name: "Bayan Resources" },
    // Finance (Non-Bank)
    { ticker: "ADMF", name: "Adira Dinamika Multi Finance" },
    { ticker: "BFIN", name: "BFI Finance" },
    { ticker: "PNLF", name: "Panin Financial" },
    { ticker: "TRIM", name: "Trimegah Sekuritas" },
    // Logistics & Transportation
    { ticker: "ASSA", name: "Adi Sarana Armada" },
    { ticker: "BIRD", name: "Blue Bird" },
    // Others
    { ticker: "ESSA", name: "Surya Esa Perkasa" },
    { ticker: "BRPT", name: "Barito Pacific" },
    { ticker: "TPIA", name: "Chandra Asri Pacific" },
    { ticker: "INKP", name: "Indah Kiat Pulp & Paper" },
    { ticker: "TKIM", name: "Pabrik Kertas Tjiwi Kimia" },
    { ticker: "MNCN", name: "Media Nusantara Citra" },
    { ticker: "SMCB", name: "Solusi Bangun Indonesia" },
    { ticker: "CLEO", name: "Sariguna Primatirta" },
    { ticker: "ARTO", name: "Bank Jago" },
    { ticker: "AGII", name: "Aneka Gas Industri" },
];

export default IDX_STOCKS;
