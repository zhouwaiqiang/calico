(function () {
    window.initializeSearch = function (currentDocVersion, poweredBySelector, searchInputSelector, searchContentSelector,
        searchResultsSelector, searchPaginationSelector) {
        if (!currentDocVersion || typeof (currentDocVersion) !== 'string') {
            throw new Error('Provide a version');
        }

        if (!searchInputSelector || typeof searchInputSelector !== 'string') {
            throw new Error('Provide a search input selector');
        }

        if (!searchContentSelector || typeof searchContentSelector !== 'string') {
            throw new Error('Provide a search content selector');
        }

        if (!searchResultsSelector || typeof searchResultsSelector !== 'string') {
            throw new Error('Provide a search results selector');
        }

        if (!searchPaginationSelector || typeof searchPaginationSelector !== 'string') {
            throw new Error('Provide a search pagination selector');
        }

        $(document).ready(function () {
            initializeInstantSearch(currentDocVersion, poweredBySelector, searchInputSelector, searchResultsSelector,
                searchPaginationSelector);
            initializePopover(searchContentSelector, searchInputSelector);
            hidePopoversOnClickOutside();
        });
    };

    function initializeInstantSearch(currentDocVersion, poweredBySelector, inputSelector, resultsSelector, paginationSelector) {
        var search = instantsearch({
            indexName: 'projectcalico',
            searchClient: algoliasearch(
                'BH4D9OD16A',
                '99def7ba73ea2430f7f42383148fe57a',
            ),
            routing: false,
        });
        search.addWidget(instantsearch.widgets.configure({
            hitsPerPage: 10,
            facetsRefinements: {
                version: [currentDocVersion]
            },
            facets: ['version']
        }));
        search.addWidget(instantsearch.widgets.searchBox({
            container: inputSelector,
            placeholder: 'Search in the documentation',
            autofocus: false,
            poweredBy: true
        }));

        search.addWidget(instantsearch.widgets.poweredBy({
            container: poweredBySelector,
            cssClasses: {
                root: `${poweredBySelector.split('.')[1]}__container`,
                link: `${poweredBySelector.split('.')[1]}__link`,
                logo: `${poweredBySelector.split('.')[1]}__icon`,
            },
        }));
  

        const customHits = instantsearch.connectors.connectHits(renderHits);

        search.addWidgets([
            customHits({
                container: document.querySelector(resultsSelector),
                templates: {
                    empty: 'No results',
                },
                transformItems: searchResults => {
                    searchResults.sort(function (a, b) {
                        var hitATopCategory = a.hierarchy.lvl0;
                        var hitBTopCategory = b.hierarchy.lvl0;

                        return hitATopCategory < hitBTopCategory
                            ? -1
                            : hitATopCategory > hitBTopCategory;
                    });

                    var visitedTopCategories = [];

                    searchResults.forEach(function (hit) {
                        var hitTopCategory = hit.hierarchy.lvl0;

                        var hitTopCategoryIndex = visitedTopCategories.indexOf(hitTopCategory);

                        if (hitTopCategory && hitTopCategoryIndex !== -1) {
                            hit.shouldDisplayTopCategory = false;
                        } else {
                            hit.shouldDisplayTopCategory = true;
                            visitedTopCategories.push(hitTopCategory);
                        }
                    });

                    return searchResults;
                }
            }),
        ]);

        const pagination = instantsearch.widgets.panel({
            hidden: ({ results }) => results.nbPages === 1,
          })(instantsearch.widgets.pagination);

        search.addWidget(pagination({
            container: paginationSelector,
            maxPages: 20,
            scrollTo: false
        }));
        search.start();
    }

    function initializePopover(searchContentSelector, searchInputSelector) {
        var content = $(searchContentSelector).children();
        $(searchInputSelector).popover({
            html: true,
            placement: 'bottom',
            trigger: 'manual',
            viewport: { selector: ".container-fluid", padding: 10 },
            content: function () {
                return content;
            }
        });
    }

    function hidePopoversOnClickOutside() {
        $("[data-toggle='popover']").popover({trigger: "click"}).click(function (event) {
            $("[data-toggle='popover']").popover('show');
            event.stopPropagation();
        }).on('inserted.bs.popover', function () {
            $(".popover").click(function (event) {
                event.stopPropagation();
            })
        })
        
        $(document).click(function () {
            $("[data-toggle='popover']").popover('hide');
        })
    }

    function renderHits(renderOptions) {

        const { hits, widgetParams } = renderOptions;

        const content = hits.reduce((currentHtml, hit) => {
            if (hit.shouldDisplayTopCategory && hit.hierarchy.lvl0) {
                currentHtml += `
                    <a href="${hit.url}" class="search-results__group-header">
                        ${hit._highlightResult.hierarchy.lvl0.value}
                    </a>
                `;
            }

            currentHtml += `
                <div class="search-results__search-result search-result columns-layout">
                    <div class="columns-layout__left-column">
            `;

            if (hit.hierarchy.lvl1) {
                currentHtml += `
                    <a href="${hit.url}" class="search-result__subcategory">
                        ${hit._highlightResult.hierarchy.lvl1.value}
                    </a>
                `;
            }

            currentHtml += `
                </div>
                <div class="columns-layout__right-column">
            `;

            if (hit.hierarchy.lvl2) {
                currentHtml += `
                    <a href="${hit.url}" class="search-result__subsubcategory">
                        ${hit._highlightResult.hierarchy.lvl2.value}
                    </a>
                `;
            }

            if (hit.hierarchy.lvl3) {
                currentHtml += `
                    <a href="${hit.url}" class="search-result__subsubcategory">
                        ${hit._highlightResult.hierarchy.lvl3.value}
                    </a>
                `;
            }

            if (hit.content) {
                currentHtml += `
                    <a href="${hit.url}" class="search-result__content">
                        ${hit._snippetResult.content.value}
                    </a>
                `;
            }

            currentHtml += `
                </div>
                </div>
            `;

            return currentHtml;
        }, '');

        widgetParams.container.innerHTML = `
            <div class="search-results">
                ${content}
            </div>
        `;
    }
})();
