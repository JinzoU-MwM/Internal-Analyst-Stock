/**
 * System-defined conglomerate groups for the watchlist.
 * These are read-only and displayed separately in the sidebar.
 */
export const SYSTEM_GROUPS = {
    "Happy Hapsoro": ["RAJA", "BUVA", "MINA", "RATU", "SINI", "PSKT"],
    "Prajogo Pangestu": ["BRPT", "TPIA", "CUAN", "BREN", "PTRO", "GZCO"],
    "Bakrie Group": ["BNBR", "BUMI", "BRMS", "ENRG", "DEWA", "VIVA", "MDIA", "UNSP"],
    "Lippo Group": ["LPCK", "LPKR", "SILO", "MLPL", "LPPF", "LPGI", "NOBU"]
};

/**
 * Get all system group names
 */
export const getSystemGroupNames = () => Object.keys(SYSTEM_GROUPS);

/**
 * Get tickers for a specific group
 */
export const getGroupTickers = (groupName) => SYSTEM_GROUPS[groupName] || [];
