import React from "react";
import MainLayout from "../layouts/MainLayout";
import PropTypes from "prop-types";
import ProductDetails from "../components/ProductDetails/ProductDetails";

const ProductDetailsPage = () => {
  return (
   <ProductDetails/>
  );
};

export default ProductDetailsPage

MainLayout.propTypes = {
    children : PropTypes.node
}
