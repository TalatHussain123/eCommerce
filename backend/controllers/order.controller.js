import factoryModel from "../model/factory.model.js";
import Order from "../model/order.model.js";
import productModel from "../model/product.model.js";
import supplierModel from "../model/supplier.model.js";
import User from "../model/user.model.js";

export const createOrder = async (req, res) => {
  const { shippingAddress } = req.body;
  const userId = req.user._id;
  const { role } = req.user;

  try {
    const { orderItems, paymentInfo } = req.body;
    if (!orderItems || !orderItems.length || !paymentInfo || !paymentInfo.id || !paymentInfo.status) {
      return res.status(400).json({ message: 'Order items and payment information are required' });
    }

    const user = await ({
      User: User,
      Supplier: supplierModel,
      Factory: factoryModel
    }[role].findById(userId));

    if (!user) return res.status(404).json({ message: 'Not found' });

    if (!user.shippingAddress) {
      user.shippingAddress = shippingAddress;
      await user.save();
    }

    const fieldName = (role === 'User') ? 'customerName' : 'companyName';
    const fieldValue = (role === 'User') ? user.username : user.companyName;

    const newOrderData = {
      roleId: userId,
      role: role,
      orderItems: orderItems,
      paymentInfo: paymentInfo,
      [fieldName]: fieldValue,
    };

    const newOrder = new Order(newOrderData);
    const savedOrder = await newOrder.save();
    res.status(200).json(savedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json("Order has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
}

//GET ALL
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    const totalCount = await Order.countDocuments();
    res.status(200).json({ totalCount, orders });
  } catch (err) {
    res.status(500).json(err);
  }
}

export const updateOrderStatus = async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHander("Order not found with this Id", 404));
  }

  if (order.orderStatus === "Recieved") {
    return next(new ErrorHander("You have already recieved this order", 400));
  }

  if (req.body.status === "Shipped") {
    order.orderItems.forEach(async (o) => {
      await updateStock(o.productId, o.quantity);
    });
  }
  order.orderStatus = req.body.status;
  await order.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
  });
}

const updateStock = async (id, quantity) => {
  const product = await productModel.findById(id);
  product.inventory -= quantity;
  await product.save({ validateBeforeSave: false });
}

//Get Order Details
export const orderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const totalPrice = order.itemsPrice + order.taxPrice + order.deliveryCharges;

    res.status(200).json({
      order: {
        _id: order._id,
        userId: order.userId,
        customerName: order.customerName,
        orderItems: order.orderItems,
        paymentInfo: order.paymentInfo,
        itemsPrice: order.itemsPrice,
        taxPrice: order.taxPrice,
        deliveryCharges: order.deliveryCharges,
        orderStatus: order.orderStatus,
        totalPrice: totalPrice
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

//Get 5 top product
export const topOrderProduct = async (req, res) => {
  try {
    // Get the top five sold orders with status "confirmed"
    const topSoldOrders = await Order.aggregate([
      { $match: { 'orderStatus': 'Shipped' } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: { productId: '$orderItems.productId', price: '$orderItems.price' },
          totalSold: { $sum: '$orderItems.quantity' }
        }
      },
      { $sort: { '_id.productId': 1 } },
      { $limit: 5 }
    ]);
    res.status(200).json({ topSoldOrders: topSoldOrders });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const getMonthlyRevenue = async (req, res) => {
  try {
    const revenuePerMonth = await Order.aggregate([
      {
        $match: { orderStatus: "Completed" }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalRevenue: { $sum: "$itemsPrice" },
          totalTax: { $sum: "$taxPrice" },
          totalDelivery: { $sum: "$deliveryCharges" },
          totalOrders: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalRevenue: 1,
          totalTax: 1,
          totalDelivery: 1,
          totalOrders: 1
        }
      },
      {
        $sort: { year: 1, month: 1 }
      }
    ]);

    res.status(200).json(revenuePerMonth);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// UPDATE
// export const updateOrder = async (req, res) => {
//   try {
//     const updatedOrder = await Order.findByIdAndUpdate(
//       req.params.id,
//       {
//         $set: req.body,
//       },
//       { new: true }
//     );
//     res.status(200).json(updatedOrder);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// }

//GET USER ORDERS
// export const getOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({ userId: req.user._id });
//     res.status(200).json(orders);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// }