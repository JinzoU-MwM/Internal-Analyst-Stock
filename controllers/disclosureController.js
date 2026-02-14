/**
 * Disclosure Controller — proxies tradersaham.com disclosure API
 */

const TRADERSAHAM_BASE = "https://api.tradersaham.com/api/disclosures";

const VALID_CATEGORIES = ["others", "dividends", "rups"];

export const getDisclosures = async (req, res) => {
    try {
        const category = req.params.category || "others";

        if (!VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({
                success: false,
                error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
            });
        }

        const response = await fetch(`${TRADERSAHAM_BASE}/${category}`);

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: `Upstream API returned ${response.status}`,
            });
        }

        const json = await response.json();

        res.json({
            success: true,
            category,
            data: json.data || [],
        });
    } catch (err) {
        console.error("Disclosure fetch error:", err.message);
        res.status(500).json({
            success: false,
            error: "Failed to fetch disclosures",
        });
    }
};
