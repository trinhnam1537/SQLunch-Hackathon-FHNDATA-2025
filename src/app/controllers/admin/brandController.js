const brand = require('../../models/brandModel')
const product = require('../../models/productModel')
const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key   : process.env.API_KEY,
  api_secret: process.env.API_SECRET,
})

class allBrandsController {
  async getBrands(req, res, next) {
    try {
      const currentPage  = req.body.page
      let sort           = req.body.sort
      let filter         = req.body.filter
      const itemsPerPage = req.body.itemsPerPage
      const skip         = (currentPage - 1) * itemsPerPage

      if (Object.keys(sort).length === 0) {
        sort = { updatedAt: -1 }
      }

      if (filter['_id']) {
        filter['_id'] = ObjectId.createFromHexString(filter['_id'])
      }

      const [data, dataSize] = await Promise.all([
        brand
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(itemsPerPage)
          .lean(),
        brand.find(filter).countDocuments(),
      ]) 
      if (!data) throw new Error('Data not found')
      return res.json({data: data, data_size: dataSize})
    } catch (error) {
      console.log(error)
      return res.json({error: error})
    }
  }

  async getFilter(req, res, next) {
  
  }
  
  async allBrands(req, res, next) {
    try {
      return res.render('admin/all/brand', { title: 'Brand List', layout: 'admin' })
    } catch (error) {
      console.log(error)
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' }) 
    }
  }

  async getBrand(req, res, next) {
    try {
      const brandInfo = await brand.findOne({ _id: req.body.id }).lean()
      if (!brandInfo) throw new Error('error')
  
      const productsInfo = await product.find({ brand: brandInfo.name }).lean()
  
      res.json({brandInfo: brandInfo, productsInfo: productsInfo})
    } catch (error) {
      return res.json({error: error})
    }
  }

  async brandUpdate(req, res, next) {
    try {
      const { id, name, img, oldImageId } = req.body;

      if (!id || !name) {
        return res.status(400).json({ error: 'Brand ID and name are required' });
      }

      let updateData = { name: name.trim() };

      // Handle new logo upload
      if (img && img.startsWith('data:image')) {
        const uploadResult = await cloudinary.uploader.upload(img, {
          folder: 'brands',
          use_filename: true,
          unique_filename: false,
          overwrite: true
        });

        updateData.img = {
          path: uploadResult.secure_url,
          filename: uploadResult.public_id
        };

        // Delete old logo from Cloudinary (if exists and different)
        if (oldImageId && oldImageId !== uploadResult.public_id) {
          await cloudinary.uploader.destroy(oldImageId).catch((err) => {
            console.log('Failed to delete old brand logo:', err.message);
          });
        }
      }

      const updatedBrand = await brand.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      if (!updatedBrand) {
        return res.status(404).json({ error: 'Brand not found' });
      }

      return res.json({
        message: 'Brand updated successfully',
        brand: updatedBrand
      });

    } catch (error) {
      console.error('Brand update error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  async brandCreated(req, res, next) {
    try {
      const { name, img } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Brand name is required' });
      }

      const trimmedName = name.trim();

      // Check duplicate
      const existingBrand = await brand.findOne({ 
        name: { $regex: `^${trimmedName}$`, $options: 'i' } 
      }).lean();

      if (existingBrand) {
        return res.status(409).json({ error: 'Brand already exists' });
      }

      let imageData = {};

      // Upload logo to Cloudinary if provided
      if (img && img.startsWith('data:image')) {
        const uploadResult = await cloudinary.uploader.upload(img, {
          folder: 'brands',
          use_filename: true,
          unique_filename: false,
          overwrite: true
        });

        imageData = {
          img: {
            path: uploadResult.secure_url,
            filename: uploadResult.public_id
          }
        };
      }

      // Create new brand
      const newBrand = await brand.create({
        name: trimmedName,
        ...imageData
      });

      return res.status(201).json({
        message: 'Brand created successfully',
        brand: newBrand
      });

    } catch (error) {
      console.error('Brand creation error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
module.exports = new allBrandsController