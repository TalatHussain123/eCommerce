import wholeSeller from '../model/wholeseller.model.js'

export const updateSeller = async (req, res) => {
    try {
        const roleId = req.user._id;
        const { companyName, contactPersonName, email, businessType, phoneNumber, countryAddress } = req.body;
        const avatar = req.file;

        const update = {};
        if (companyName) update.companyName = companyName;
        if (contactPersonName) update.contactPersonName = contactPersonName;
        if (email) update.email = email;
        if (businessType) update.businessType = businessType;
        if (phoneNumber) update.phoneNumber = phoneNumber;
        if (countryAddress) update.countryAddress = countryAddress;

        const updatedSeller = await wholeSeller.findByIdAndUpdate(roleId, update, { new: true });

        if (!updatedSeller) {
            throw new Error("Seller not found!");
        }
        if (avatar) {
            updatedSeller.avatar = avatar.buffer;
        }
        res.status(200).json({ success: true, message: "seller has been updated!", });
        return updatedSeller;
    } catch (err) {
        throw err;
    }
};

