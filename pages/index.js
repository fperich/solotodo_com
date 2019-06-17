import React from 'react';
import Head from "next/head";
import { connect } from 'react-redux'
import {withRouter} from 'next/router'
import { formatCurrency } from "../react-utils/next_utils";
import { solotodoStateToPropsUtils } from "../redux/utils";
import ProductsReel from "../components/Product/ProductsReel";
import TopBanner from "../components/TopBanner";
import {settings} from '../settings';
import {withSoloTodoTracker} from "../utils";

class Index extends React.Component {
  static async getInitialProps({ reduxStore, res }) {
    const {preferredCountryStores} = solotodoStateToPropsUtils(reduxStore.getState());
    const popularProductsData = await ProductsReel.getInitialProps(preferredCountryStores, 'leads');
    const discountedProductsData = await ProductsReel.getInitialProps(preferredCountryStores, 'discount');

    return {
      popularProducts: popularProductsData['productEntries'],
      discountedProducts: discountedProductsData['productEntries']
    }
  }

  render () {
    const preferredCurrency = this.props.preferredCurrency;

    const ribbonFormatter = value => {
      const localizedDiscount = formatCurrency(
        value,
        this.props.usdCurrency,
        preferredCurrency,
        this.props.preferredNumberFormat.thousands_separator,
        preferredCurrency.decimal_separator);
      return `Bajó ${localizedDiscount}!`;
    };

    return <React.Fragment>
      <Head>
        <title>Cotiza y compara los precios de todas las tiendas - SoloTodo</title>
        <meta property="og:title" content={`Cotiza y ahorra cotizando todos tus productos de tecnología en un sólo lugar - SoloTodo`} />
        <meta name="description" property="og:description" content={`Ahorra tiempo y dinero cotizando celulares, notebooks, etc. en un sólo lugar y comparando el precio de todas las tiendas.`} />
      </Head>
      <div className="container-fluid">
        <div className="row">
          <TopBanner category="Any" />

          <div className="col-12">
            <h1>Lo más visto en SoloTodo</h1>
          </div>

          <div className="col-12">
            <ProductsReel
              initialProductEntries={this.props.popularProducts}
              ribbonFormatter={value => `${parseInt(value, 10)} visitas`}
              ordering="leads"
            />
          </div>

          <div className="col-12 mt-3">
            <h1>Ofertas del día</h1>
          </div>

          <div className="col-12">
            <ProductsReel
              initialProductEntries={this.props.discountedProducts}
              ribbonFormatter={ribbonFormatter}
              ordering="discount"
            />
          </div>
        </div>
      </div>
    </React.Fragment>
  }
}

function mapStateToProps(state) {
  const {preferredCountry, preferredStores, preferredCurrency, preferredNumberFormat, currencies} = solotodoStateToPropsUtils(state);

  return {
    apiResourceObjects: state.apiResourceObjects,
    preferredCountry,
    preferredStores,
    preferredCurrency,
    preferredNumberFormat,
    usdCurrency: currencies.filter(currency => currency.id === settings.usdCurrencyId)[0]
  }
}

function mapPropsToGAField(props) {
  return {
    pageTitle: 'Cotiza y compara los precios de todas las tiendas'
  }
}

const TrackedIndex = withSoloTodoTracker(Index, mapPropsToGAField);
export default withRouter(connect(mapStateToProps)(TrackedIndex))
