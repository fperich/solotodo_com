import React from 'react'
import Router, {withRouter} from 'next/router'
import Big from 'big.js';
import {apiResourceStateToPropsUtils} from "../../react-utils/ApiResource";
import {settings} from "../../settings";
import {solotodoStateToPropsUtils} from "../../redux/utils";
import Loading from "../../components/Loading";
import {fetchJson} from "../../react-utils/utils";
import TopBanner from "../../components/TopBanner";
import {Alert} from "reactstrap";

class BudgetEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pricingEntries: undefined,
      nameEditModalIsActive: false,
      budgetDeleteModalIsActive: false,
      createBudgetEntryModalIsActive: false,
      exportedBBCodeModalIsActive: false,
      exportedImageModalIsActive: false,
      exportedImageUrl: undefined,
      compatibilityIssues: undefined,
      bbCode: undefined,
      budgetEditName: undefined
    }
  }

  static async getInitialProps(ctx){
    const { res, query, reduxStore } = ctx;
    const reduxState = reduxStore.getState();

    const {user, categories, preferredCountryStores} = solotodoStateToPropsUtils(reduxState);
    const {fetchAuth} = apiResourceStateToPropsUtils(reduxState, ctx);

    const budgetId = query.id;
    const budgetUrl = `${settings.apiResourceEndpoints.budgets}${budgetId}`;

    let budget;

    try{
      budget = await fetchAuth(budgetUrl);
    } catch (e) {
      if (res) {
        res.statusCode=404;
        res.end('Not found');
        return
      }
    }

    if (!user || !user.is_superuser || budget.user.id !== user.id) {
      if (res) {
        res.writeHead(302, {
          Location: '/'
        });
        res.end()
      } else {
        Router.push('/')
      }
      return
    }

    return {
      user,
      budget,
      budgetCategories: categories.filter(category => category.budget_ordering),
      preferredCountryStores
    }
  }

  componentDidMount() {
    this.componentUpdate(this.props.budget, this.props.preferredCountryStores)
  }

  componentUpdate(budget, stores) {
    if (budget.products_pool.length) {
      let url = 'products/available_entities/?';
      for (const product of budget.products_pool) {
        url += `ids=${product.id}&`
      }

      for (let store of stores) {
        url += `&stores=${store.id}`;
      }

      fetchJson(url).then(response => {
        const pricingEntries = response.results;
        pricingEntries.sort((a, b) => a.product.name <= b.product.name ? -1 : 1);

        this.setState({
          pricingEntries,
          budgetEditName: budget.name
        })
      })
    } else {
      this.setState({
        pricingEntries: [],
        budgetEditName: budget.name
      })
    }

  }

  render() {
    if (!this.state.pricingEntries) {
      return <Loading/>
    }

    const budget = this.props.budget;
    let totalPrice = new Big(0);

    for (const budgetEntry of budget.entries) {
      if (!budgetEntry.selected_store) {
        continue
      }

      const pricingEntry = this.state.pricingEntries.filter(entry => entry.product.url === budgetEntry.selected_product)[0] || null;

      if (!pricingEntry) {
        continue
      }

      const matchingEntity = pricingEntry.entities.filter(entity => entity.store === budgetEntry.selected_store)[0] || null;

      if (matchingEntity) {
        totalPrice = totalPrice.plus(new Big(matchingEntity.active_registry.offer_price));
      }
    }

    const budgetCategories = this.props.budgetCategories;
    budgetCategories.sort(function (category1, category2) {
      let category1ordering = category1.budget_ordering;
      let category2ordering = category2.budget_ordering;
      if (category1ordering < category2ordering) {
        return -1;
      } else if (category1ordering > category2ordering) {
        return 1;
      } else {
        return 0;
      }
    });

    return <div className="pl-3 pr-3">
      <div className="row">
        <TopBanner category="Hardware"/>
        <div className="col-12">
          <h1 className="budget-name">{budget.name}</h1>
        </div>
        {!this.state.pricingEntries.length && <div className="col-12">
          <div>
            <Alert color="info">
              <i className="fas fa-exclamation-circle">&nbsp;</i> ¡Tu cotización está vacía! Navega por los
              productos de SoloTodo y haz click en "Agregar a cotización" para incluirlos
            </Alert>
          </div>
        </div>}
      </div>
      <div className="row">
        <div className="col-12">
          <div className="content-card">
            <table id="budget-edit-table" className="table mb-0">
              <thead>
              <tr>
                <th scope="col">Componente</th>
                <th scope="col">Producto</th>
                <th scope="col">Tienda</th>
                <th scope="col">Quitar</th>
              </tr>
              </thead>
            </table>
          </div>
        </div>
      </div>
    </div>
  }
}

export default withRouter(BudgetEdit)