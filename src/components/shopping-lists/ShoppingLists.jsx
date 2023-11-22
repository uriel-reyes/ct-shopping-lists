import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react'; //these are apollo client "hooks", which are similar to js functions
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants'; 
import {
  DataTable,
  PrimaryButton,
  LoadingSpinner,
  ContentNotification,
  Spacings,
  MultilineTextInput
} from '@commercetools-frontend/ui-kit';
import {fetchShoppingLists, fetchUniqueList} from './queries.graphql'; //this is a query
import {deleteShoppingList} from './mutations.graphql'; //this is a mutation


const ShoppingLists = () => {
  const { error, data, loading, refetch } = useQuery(fetchShoppingLists, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });
  

  const [inputId, setInputId] = useState('');
  const [selectedListDetails, setSelectedListDetails] = useState(null);
  const [delShoppingList] = useMutation(deleteShoppingList);
  const [getShoppingList, { data: listData }] = useLazyQuery(fetchUniqueList);
  const [versions, setVersions] = useState({});

  useEffect(() => {
    if (data && data.shoppingLists && data.shoppingLists.results) {
      const newVersions = {};
      data.shoppingLists.results.forEach(list => {
        newVersions[list.id] = list.version;
      });
      setVersions(newVersions);
    }
  }, [data]);

  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  const handleDelete = async (id) => {
    const version = versions[id];
    if (id && version) {
      await delShoppingList({
        variables: { version, id },
        context: { target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM }
      });
      refetch(); // Refetch the shopping lists
      setShowSuccessNotification(true); // Show success notification
      setTimeout(() => setShowSuccessNotification(false), 3000); // Hide notification after 3 seconds
    }
  };

  const handleViewList = (id) => {
    getShoppingList({ 
      variables: { shoppingListId: id },
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      }
    });
  };

  useEffect(() => {
    if (listData) {
      setSelectedListDetails(listData.shoppingList);
    }
  }, [listData]);

  const tableItems = data && data.shoppingLists && data.shoppingLists.results 
  ? data.shoppingLists.results.map(list => ({
      id: list.id,
      name: list.nameAllLocales ? list.nameAllLocales.map(name => name.value).join(', ') : '',
      description: list.description || '-'
    }))
  : [];

if(loading) return <LoadingSpinner />;
if(error) return <ContentNotification>{`Error - ${error.message}`}</ContentNotification>;

const lineItemRows = selectedListDetails && selectedListDetails.lineItems
    ? selectedListDetails.lineItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity // Added quantity here
      }))
    : [];

  return (
    <div>
      {showSuccessNotification && <ContentNotification type="success">List successfully deleted</ContentNotification>}
      <DataTable
        rows={tableItems}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'id', label: 'ID' },
          { key: 'description', label: 'Description' },
        ]}
        onRowClick={(row) => handleViewList(row.id)}
      />
      <Spacings.Stack scale="m">
        <MultilineTextInput
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          onSubmit={(val) => handleViewList(val)}
          onReset={() => setInputId('')}
          placeholder="Enter List ID"
        />
        <Spacings.Inline>
          <PrimaryButton label="View Shopping List" onClick={() => handleViewList(inputId)} />
          <PrimaryButton label="Delete Shopping List" onClick={() => handleDelete(inputId)} />
        </Spacings.Inline>
      </Spacings.Stack>
      {selectedListDetails && (
        <Spacings.Stack scale="m">
      <DataTable
        rows={lineItemRows}
        columns={[
          { key: 'id', label: 'Product ID' },
          { key: 'name', label: 'Name' },
          { key: 'quantity', label: 'Quantity' } // Updated columns to include quantity
        ]}
    />
      </Spacings.Stack>
    )}
  </div>
);
};

export default ShoppingLists;