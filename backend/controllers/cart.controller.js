import Cart from "../model/cart.model.js";

// Add a product to the cart
export const addToCart = async (req, res) => {
    const { roleId, products } = req.body;
    const { role } = req.user;
    try {
        const newCart = new Cart({
            roleId: roleId,
            role: role,
            products: products
        });

        const savedCart = await newCart.save();
        res.status(200).json(savedCart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Update the cart
export const updateCart = async (req, res) => {
    try {
        const updatedCart = await Cart.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.status(200).json(updatedCart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// Delete all carts
export const deleteAllCarts = async (req, res) => {
    try {
        const { id } = req.params;
        await Cart.deleteMany({ roleId: id });
        res.status(200).json({ message: "All carts have been deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const deleteProductFromCart = async (req, res) => {
    const productId = req.params.pid;
    const userId = req.user._id;
    try {
        const cart = await Cart.findOne({ roleId: userId });
        if (!cart) {
            return res.status(404).json({ error: "Cart not found." });
        }
        cart.products = cart.products.filter(product => product.productId.toString() !== productId);
        await cart.save();
        res.status(200).json("Product has been removed from the cart.");
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


//GET USER CART
export const getProduct = async (req, res) => {
    try {
        const cart = await Cart.find();
        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json(err);
    }
}
