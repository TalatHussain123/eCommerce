import Product from "../model/product.model.js";
import SearchHistory from "../model/search.model.js";

export const addProduct = async (req, res) => {
    const newProductData = req.body;
    try {
        let taxPrice = 0;
        if (req.body.includeTax) {
            taxPrice = 5;
        }
        let createdBy;
        if (req.user.role === 'User' && req.user.isAdmin === true) {
            createdBy = 'Admin';
        } else {
            createdBy = req.user.role;
        }

        const newProduct = new Product({
            ...newProductData,
            taxPrice: taxPrice,
            createdBy: createdBy
        });

        const savedProduct = await newProduct.save();
        res.status(200).json(savedProduct);
    } catch (err) {
        res.status(500).json(err);
    }
}

export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ msgCode: 'PRODUCT_NOT_FOUND', status: 404 });
        }
        if (req.user.role === 'User' && req.user.isAdmin === true) {
            const updatedProduct = await Product.findByIdAndUpdate(
                req.params.id,
                { $set: req.body },
                { new: true }
            );
            res.status(200).json(updatedProduct);
        }
        if (req.user.role !== product.createdBy) {
            return res.status(403).json({ msgCode: 'PERMISSION_DENIED', status: 403 });
        }
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.status(200).json(updatedProduct);
    } catch (err) {
        res.status(500).json({ msgCode: 'SERVER_ERROR', status: 500 });
    }
};


export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ msgCode: 'PRODUCT_NOT_FOUND', status: 404 });
        }
        if (req.user.role === 'User' && req.user.isAdmin === true) {
            await Product.findByIdAndDelete(req.params.id);
            return res.status(200).json({ msgCode: 'PRODUCT_DELETED', status: 200 });
        }
        if (req.user.role !== product.createdBy) {
            return res.status(403).json({ msgCode: 'PERMISSION_DENIED', status: 403 });
        }
        await Product.findByIdAndDelete(req.params.id);
        return res.status(200).json({ msgCode: 'PRODUCT_DELETED', status: 200 });
    } catch (err) {
        res.status(500).json({ msgCode: 'SERVER_ERROR', status: 500 });
    }
};

export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json(err);
    }
}

async function getProductCountsPerCategory() {
    try {
        const result = await Product.aggregate([
            { $unwind: "$categories" },
            { $group: { _id: "$categories", count: { $sum: 1 } } },
        ]);
        return result;
    } catch (error) {
        console.error("Error getting product counts per category:", error);
        throw error;
    }
}

//get all products and also get with home category gender and search history
export const getAllProduct = async (req, res) => {
    const { home, category, gender, search, showcategory } = req.query;
    const userId = req.user._id;
    try {
        let products;
        let categoryCounts;
        let searchHistory;

        if (home === 'home') {
            products = await Product.find().sort({ createdAt: -1 }).limit(10);
            categoryCounts = await getProductCountsPerCategory();
        } else if (category) {
            products = await Product.find({ categories: { $in: [category] } });
        } else if (showcategory === 'category') {
            products = await Product.find();
            const categorizedProducts = products.reduce((acc, product) => {
                product.categories.forEach(cat => {
                    if (!acc[cat]) {
                        acc[cat] = [];
                    }
                    acc[cat].push(product);
                });
                return acc;
            }, {});
            return res.status(200).json({ categorizedProducts });
        }
        else if (gender) {
            products = await Product.find({ gender });
        } else if (search) {
            products = await Product.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } }, // Case-insensitive search by name
                ]
            });
            searchHistory = await SearchHistory.create({ userId, query: search });
        } else {
            products = await Product.find();
        }
        res.status(200).json({ products, categoryCounts, searchHistory });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const removeFromSearchHistory = async (req, res) => {
    const userId = req.user._id;
    try {
        await SearchHistory.deleteMany({ userId });
        res.status(200).json({ success: true, message: "Search history item removed successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const filterProducts = async (req, res) => {
    const { category, size, color, minPrice, maxPrice, sortBy, newest } = req.query;

    try {

        let filters = {};
        if (category) {
            filters.categories = category;
        }
        if (size) {
            filters.size = size;
        }
        if (color) {
            filters.color = color;
        }

        if (minPrice !== undefined && maxPrice !== undefined) {
            filters.price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
        } else if (minPrice !== undefined) {
            filters.price = { $gte: parseFloat(minPrice) };
        } else if (maxPrice !== undefined) {
            filters.price = { $lte: parseFloat(maxPrice) };
        }

        let sortOptions = {};
        if (sortBy === 'priceHighToLow') {
            sortOptions.price = -1;
        } else if (sortBy === 'priceLowToHigh') {
            sortOptions.price = 1;
        } else if (newest) {
            sortOptions.createdAt = -1;
        } else {
            sortOptions = { createdAt: -1 };
        }

        const products = await Product.find(filters).sort(sortOptions);
        res.status(200).json({ products });
    } catch (error) {
        console.error('Error filtering products:', error);
        res.status(500).json({ error: 'Failed to filter products' });
    }
};