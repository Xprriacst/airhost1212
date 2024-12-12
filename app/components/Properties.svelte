<content>
<script lang="ts">
  import { ListView, ObservableArray } from '@nativescript/core';
  
  let properties = new ObservableArray([
    {
      id: '1',
      name: 'Sunset Villa',
      address: '123 Ocean Drive, Miami Beach, FL',
      autoPilot: false,
      conversations: 2,
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6'
    },
    {
      id: '2',
      name: 'Mountain Lodge',
      address: '456 Pine Road, Aspen, CO',
      autoPilot: false,
      conversations: 1,
      image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233'
    }
  ]);

  function toggleAutoPilot(propertyId) {
    const index = properties.findIndex(p => p.id === propertyId);
    if (index !== -1) {
      const property = properties.getItem(index);
      properties.setItem(index, { ...property, autoPilot: !property.autoPilot });
    }
  }

  function onPropertyTap(args) {
    const property = properties.getItem(args.index);
    // Navigate to property conversations
    // frame.navigate({ moduleName: "conversations", context: { propertyId: property.id } });
  }
</script>

<gridLayout rows="auto, *">
  <label row="0" text="My Properties" class="h2 p-10" />
  <listView row="1" items="{properties}" on:itemTap="{onPropertyTap}">
    <Template let:item>
      <gridLayout rows="200, auto" class="property-card m-10">
        <image row="0" src="{item.image}" class="rounded" stretch="aspectFill" />
        <stackLayout row="1" class="p-10">
          <label text="{item.name}" class="h3" />
          <label text="{item.address}" class="body" />
          <flexboxLayout justifyContent="space-between" alignItems="center">
            <label text="{item.conversations} conversations" class="footnote" />
            <button 
              text="{item.autoPilot ? 'Auto-pilot ON' : 'Auto-pilot OFF'}" 
              class="{item.autoPilot ? 'btn btn-primary' : 'btn'}"
              on:tap="{() => toggleAutoPilot(item.id)}"
            />
          </flexboxLayout>
        </stackLayout>
      </gridLayout>
    </Template>
  </listView>
</gridLayout>

<style>
  .property-card {
    background-color: white;
    border-radius: 10;
    elevation: 2;
  }
</style>
</content>