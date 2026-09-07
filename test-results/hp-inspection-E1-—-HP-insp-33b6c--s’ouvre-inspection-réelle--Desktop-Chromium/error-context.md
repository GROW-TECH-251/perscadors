# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hp-inspection.spec.ts >> E1 — HP inspection (page /looks) >> clic sur une pièce -> la fiche produit s’ouvre (inspection réelle)
- Location: tests\e2e\hp-inspection.spec.ts:16:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - link [ref=e5] [cursor=pointer]:
          - /url: /
          - img "HP Collection Logo" [ref=e6]
        - generic [ref=e7]:
          - link "Accueil" [ref=e8] [cursor=pointer]:
            - /url: /
          - link "Baskets Homme" [ref=e9] [cursor=pointer]:
            - /url: /categorie/basket-pour-homme
          - link "Complets Streetwear" [ref=e10] [cursor=pointer]:
            - /url: /categorie/complet-pour-homme
          - link "Jeans Oversize" [ref=e11] [cursor=pointer]:
            - /url: /categorie/jean-overside-pour-homme
          - link "Tapettes & Sandales" [ref=e12] [cursor=pointer]:
            - /url: /categorie/tapettes-pour-homme
          - link "HP Looks" [ref=e13] [cursor=pointer]:
            - /url: /looks
        - generic [ref=e14]:
          - generic [ref=e16]:
            - textbox "Rechercher..." [ref=e17]
            - button "Valider la recherche" [ref=e18] [cursor=pointer]
          - button "Panier d'achat" [ref=e22]
    - generic [ref=e27]:
      - generic [ref=e28]:
        - link "Retour à l'accueil" [ref=e29] [cursor=pointer]:
          - /url: /
        - generic [ref=e32]: 31 Looks de Vioutou
      - generic [ref=e33]:
        - heading "HP Looks de Vioutou" [level=1] [ref=e34]
        - paragraph [ref=e36]: Tous les outfits streetwear les plus stylés du Bénin. Trouve le look complet qui te correspond et recrée-le instantanément.
      - generic [ref=e37]:
        - generic [ref=e38]:
          - generic [ref=e39]:
            - 'img "Signature HP Drip (Look #29)" [ref=e40]'
            - generic [ref=e41]: Vioutou Outfit 🔥
          - generic [ref=e42]:
            - generic [ref=e43]:
              - 'heading "Signature HP Drip (Look #29)" [level=3] [ref=e44]'
              - paragraph [ref=e45]: "Pièces de cet outfit :"
              - generic [ref=e46]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e47] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e49]
                  - generic [ref=e50]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e51]
                    - generic [ref=e52]: basket pour homme
                  - generic [ref=e53]: 22,000 FCFA
                - link "Jean Baggy Destroyed Vintage Jean Baggy Destroyed Vintage jean overside pour homme 19,000 FCFA" [ref=e54] [cursor=pointer]:
                  - /url: /produit/12
                  - img "Jean Baggy Destroyed Vintage" [ref=e56]
                  - generic [ref=e57]:
                    - heading "Jean Baggy Destroyed Vintage" [level=4] [ref=e58]
                    - generic [ref=e59]: jean overside pour homme
                  - generic [ref=e60]: 19,000 FCFA
                - link "Casquette Trucker Noir & Rose Casquette Trucker Noir & Rose accessoires 8,500 FCFA" [ref=e61] [cursor=pointer]:
                  - /url: /produit/36
                  - img "Casquette Trucker Noir & Rose" [ref=e63]
                  - generic [ref=e64]:
                    - heading "Casquette Trucker Noir & Rose" [level=4] [ref=e65]
                    - generic [ref=e66]: accessoires
                  - generic [ref=e67]: 8,500 FCFA
            - generic [ref=e68]:
              - generic [ref=e69]:
                - generic [ref=e70]: Total du Look
                - generic [ref=e71]: 49,500 FCFA
              - button "Recréer ce look" [ref=e72] [cursor=pointer]
        - generic [ref=e76]:
          - generic [ref=e77]:
            - 'img "Street Silhouette (Look #24)" [ref=e78]'
            - generic [ref=e79]: Vioutou Outfit 🔥
          - generic [ref=e80]:
            - generic [ref=e81]:
              - 'heading "Street Silhouette (Look #24)" [level=3] [ref=e82]'
              - paragraph [ref=e83]: "Pièces de cet outfit :"
              - generic [ref=e84]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e85] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e87]
                  - generic [ref=e88]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e89]
                    - generic [ref=e90]: basket pour homme
                  - generic [ref=e91]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e92] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e94]
                  - generic [ref=e95]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e96]
                    - generic [ref=e97]: basket pour homme
                  - generic [ref=e98]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e99] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e101]
                  - generic [ref=e102]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e103]
                    - generic [ref=e104]: basket pour homme
                  - generic [ref=e105]: 25,000 FCFA
            - generic [ref=e106]:
              - generic [ref=e107]:
                - generic [ref=e108]: Total du Look
                - generic [ref=e109]: 71,500 FCFA
              - button "Recréer ce look" [ref=e110] [cursor=pointer]
        - generic [ref=e114]:
          - generic [ref=e115]:
            - 'img "High Top Classic (Look #25)" [ref=e116]'
            - generic [ref=e117]: Vioutou Outfit 🔥
          - generic [ref=e118]:
            - generic [ref=e119]:
              - 'heading "High Top Classic (Look #25)" [level=3] [ref=e120]'
              - paragraph [ref=e121]: "Pièces de cet outfit :"
              - generic [ref=e122]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e123] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e125]
                  - generic [ref=e126]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e127]
                    - generic [ref=e128]: basket pour homme
                  - generic [ref=e129]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e130] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e132]
                  - generic [ref=e133]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e134]
                    - generic [ref=e135]: basket pour homme
                  - generic [ref=e136]: 24,500 FCFA
            - generic [ref=e137]:
              - generic [ref=e138]:
                - generic [ref=e139]: Total du Look
                - generic [ref=e140]: 46,500 FCFA
              - button "Recréer ce look" [ref=e141] [cursor=pointer]
        - generic [ref=e145]:
          - generic [ref=e146]:
            - 'img "Cargo Explorer (Look #26)" [ref=e147]'
            - generic [ref=e148]: Vioutou Outfit 🔥
          - generic [ref=e149]:
            - generic [ref=e150]:
              - 'heading "Cargo Explorer (Look #26)" [level=3] [ref=e151]'
              - paragraph [ref=e152]: "Pièces de cet outfit :"
              - generic [ref=e153]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e154] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e156]
                  - generic [ref=e157]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e158]
                    - generic [ref=e159]: basket pour homme
                  - generic [ref=e160]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e161] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e163]
                  - generic [ref=e164]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e165]
                    - generic [ref=e166]: basket pour homme
                  - generic [ref=e167]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e168] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e170]
                  - generic [ref=e171]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e172]
                    - generic [ref=e173]: basket pour homme
                  - generic [ref=e174]: 25,000 FCFA
            - generic [ref=e175]:
              - generic [ref=e176]:
                - generic [ref=e177]: Total du Look
                - generic [ref=e178]: 69,000 FCFA
              - button "Recréer ce look" [ref=e179] [cursor=pointer]
        - generic [ref=e183]:
          - generic [ref=e184]:
            - 'img "Monochrome Hype (Look #27)" [ref=e185]'
            - generic [ref=e186]: Vioutou Outfit 🔥
          - generic [ref=e187]:
            - generic [ref=e188]:
              - 'heading "Monochrome Hype (Look #27)" [level=3] [ref=e189]'
              - paragraph [ref=e190]: "Pièces de cet outfit :"
              - generic [ref=e191]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e192] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e194]
                  - generic [ref=e195]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e196]
                    - generic [ref=e197]: basket pour homme
                  - generic [ref=e198]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e199] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e201]
                  - generic [ref=e202]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e203]
                    - generic [ref=e204]: basket pour homme
                  - generic [ref=e205]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e206] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e208]
                  - generic [ref=e209]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e210]
                    - generic [ref=e211]: basket pour homme
                  - generic [ref=e212]: 22,000 FCFA
            - generic [ref=e213]:
              - generic [ref=e214]:
                - generic [ref=e215]: Total du Look
                - generic [ref=e216]: 59,500 FCFA
              - button "Recréer ce look" [ref=e217] [cursor=pointer]
        - generic [ref=e221]:
          - generic [ref=e222]:
            - 'img "Luxe Cozy Day (Look #28)" [ref=e223]'
            - generic [ref=e224]: Vioutou Outfit 🔥
          - generic [ref=e225]:
            - generic [ref=e226]:
              - 'heading "Luxe Cozy Day (Look #28)" [level=3] [ref=e227]'
              - paragraph [ref=e228]: "Pièces de cet outfit :"
              - generic [ref=e229]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e230] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e232]
                  - generic [ref=e233]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e234]
                    - generic [ref=e235]: basket pour homme
                  - generic [ref=e236]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e237] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e239]
                  - generic [ref=e240]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e241]
                    - generic [ref=e242]: basket pour homme
                  - generic [ref=e243]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e244] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e246]
                  - generic [ref=e247]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e248]
                    - generic [ref=e249]: basket pour homme
                  - generic [ref=e250]: 25,000 FCFA
            - generic [ref=e251]:
              - generic [ref=e252]:
                - generic [ref=e253]: Total du Look
                - generic [ref=e254]: 71,500 FCFA
              - button "Recréer ce look" [ref=e255] [cursor=pointer]
        - generic [ref=e259]:
          - generic [ref=e260]:
            - 'img "Elegance & Flow (Look #30)" [ref=e261]'
            - generic [ref=e262]: Vioutou Outfit 🔥
          - generic [ref=e263]:
            - generic [ref=e264]:
              - 'heading "Elegance & Flow (Look #30)" [level=3] [ref=e265]'
              - paragraph [ref=e266]: "Pièces de cet outfit :"
              - generic [ref=e267]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e268] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e270]
                  - generic [ref=e271]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e272]
                    - generic [ref=e273]: basket pour homme
                  - generic [ref=e274]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e275] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e277]
                  - generic [ref=e278]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e279]
                    - generic [ref=e280]: basket pour homme
                  - generic [ref=e281]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e282] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e284]
                  - generic [ref=e285]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e286]
                    - generic [ref=e287]: basket pour homme
                  - generic [ref=e288]: 25,000 FCFA
            - generic [ref=e289]:
              - generic [ref=e290]:
                - generic [ref=e291]: Total du Look
                - generic [ref=e292]: 69,000 FCFA
              - button "Recréer ce look" [ref=e293] [cursor=pointer]
        - generic [ref=e297]:
          - generic [ref=e298]:
            - 'img "Streetwear Heritage (Look #31)" [ref=e299]'
            - generic [ref=e300]: Vioutou Outfit 🔥
          - generic [ref=e301]:
            - generic [ref=e302]:
              - 'heading "Streetwear Heritage (Look #31)" [level=3] [ref=e303]'
              - paragraph [ref=e304]: "Pièces de cet outfit :"
              - generic [ref=e305]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e306] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e308]
                  - generic [ref=e309]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e310]
                    - generic [ref=e311]: basket pour homme
                  - generic [ref=e312]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e313] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e315]
                  - generic [ref=e316]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e317]
                    - generic [ref=e318]: basket pour homme
                  - generic [ref=e319]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e320] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e322]
                  - generic [ref=e323]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e324]
                    - generic [ref=e325]: basket pour homme
                  - generic [ref=e326]: 22,000 FCFA
            - generic [ref=e327]:
              - generic [ref=e328]:
                - generic [ref=e329]: Total du Look
                - generic [ref=e330]: 59,500 FCFA
              - button "Recréer ce look" [ref=e331] [cursor=pointer]
        - generic [ref=e335]:
          - generic [ref=e336]:
            - 'img "Urban Legend (Look #32)" [ref=e337]'
            - generic [ref=e338]: Vioutou Outfit 🔥
          - generic [ref=e339]:
            - generic [ref=e340]:
              - 'heading "Urban Legend (Look #32)" [level=3] [ref=e341]'
              - paragraph [ref=e342]: "Pièces de cet outfit :"
              - generic [ref=e343]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e344] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e346]
                  - generic [ref=e347]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e348]
                    - generic [ref=e349]: basket pour homme
                  - generic [ref=e350]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e351] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e353]
                  - generic [ref=e354]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e355]
                    - generic [ref=e356]: basket pour homme
                  - generic [ref=e357]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e358] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e360]
                  - generic [ref=e361]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e362]
                    - generic [ref=e363]: basket pour homme
                  - generic [ref=e364]: 25,000 FCFA
            - generic [ref=e365]:
              - generic [ref=e366]:
                - generic [ref=e367]: Total du Look
                - generic [ref=e368]: 71,500 FCFA
              - button "Recréer ce look" [ref=e369] [cursor=pointer]
        - generic [ref=e373]:
          - generic [ref=e374]:
            - 'img "Summer Suede Vibe (Look #23)" [ref=e375]'
            - generic [ref=e376]: Vioutou Outfit 🔥
          - generic [ref=e377]:
            - generic [ref=e378]:
              - 'heading "Summer Suede Vibe (Look #23)" [level=3] [ref=e379]'
              - paragraph [ref=e380]: "Pièces de cet outfit :"
              - generic [ref=e381]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e382] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e384]
                  - generic [ref=e385]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e386]
                    - generic [ref=e387]: basket pour homme
                  - generic [ref=e388]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e389] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e391]
                  - generic [ref=e392]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e393]
                    - generic [ref=e394]: basket pour homme
                  - generic [ref=e395]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e396] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e398]
                  - generic [ref=e399]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e400]
                    - generic [ref=e401]: basket pour homme
                  - generic [ref=e402]: 22,000 FCFA
            - generic [ref=e403]:
              - generic [ref=e404]:
                - generic [ref=e405]: Total du Look
                - generic [ref=e406]: 59,500 FCFA
              - button "Recréer ce look" [ref=e407] [cursor=pointer]
        - generic [ref=e411]:
          - generic [ref=e412]:
            - 'img "Shadow Black Street (Look #13)" [ref=e413]'
            - generic [ref=e414]: Vioutou Outfit 🔥
          - generic [ref=e415]:
            - generic [ref=e416]:
              - 'heading "Shadow Black Street (Look #13)" [level=3] [ref=e417]'
              - paragraph [ref=e418]: "Pièces de cet outfit :"
              - generic [ref=e419]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e420] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e422]
                  - generic [ref=e423]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e424]
                    - generic [ref=e425]: basket pour homme
                  - generic [ref=e426]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e427] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e429]
                  - generic [ref=e430]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e431]
                    - generic [ref=e432]: basket pour homme
                  - generic [ref=e433]: 24,500 FCFA
            - generic [ref=e434]:
              - generic [ref=e435]:
                - generic [ref=e436]: Total du Look
                - generic [ref=e437]: 46,500 FCFA
              - button "Recréer ce look" [ref=e438] [cursor=pointer]
        - generic [ref=e442]:
          - generic [ref=e443]:
            - 'img "Retro Hype Style (Look #14)" [ref=e444]'
            - generic [ref=e445]: Vioutou Outfit 🔥
          - generic [ref=e446]:
            - generic [ref=e447]:
              - 'heading "Retro Hype Style (Look #14)" [level=3] [ref=e448]'
              - paragraph [ref=e449]: "Pièces de cet outfit :"
              - generic [ref=e450]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e451] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e453]
                  - generic [ref=e454]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e455]
                    - generic [ref=e456]: basket pour homme
                  - generic [ref=e457]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e458] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e460]
                  - generic [ref=e461]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e462]
                    - generic [ref=e463]: basket pour homme
                  - generic [ref=e464]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e465] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e467]
                  - generic [ref=e468]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e469]
                    - generic [ref=e470]: basket pour homme
                  - generic [ref=e471]: 25,000 FCFA
            - generic [ref=e472]:
              - generic [ref=e473]:
                - generic [ref=e474]: Total du Look
                - generic [ref=e475]: 69,000 FCFA
              - button "Recréer ce look" [ref=e476] [cursor=pointer]
        - generic [ref=e480]:
          - generic [ref=e481]:
            - 'img "Golden Hour Glow (Look #17)" [ref=e482]'
            - generic [ref=e483]: Vioutou Outfit 🔥
          - generic [ref=e484]:
            - generic [ref=e485]:
              - 'heading "Golden Hour Glow (Look #17)" [level=3] [ref=e486]'
              - paragraph [ref=e487]: "Pièces de cet outfit :"
              - generic [ref=e488]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e489] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e491]
                  - generic [ref=e492]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e493]
                    - generic [ref=e494]: basket pour homme
                  - generic [ref=e495]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e496] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e498]
                  - generic [ref=e499]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e500]
                    - generic [ref=e501]: basket pour homme
                  - generic [ref=e502]: 24,500 FCFA
            - generic [ref=e503]:
              - generic [ref=e504]:
                - generic [ref=e505]: Total du Look
                - generic [ref=e506]: 46,500 FCFA
              - button "Recréer ce look" [ref=e507] [cursor=pointer]
        - generic [ref=e511]:
          - generic [ref=e512]:
            - 'img "VIP Influencer Look (Look #18)" [ref=e513]'
            - generic [ref=e514]: Vioutou Outfit 🔥
          - generic [ref=e515]:
            - generic [ref=e516]:
              - 'heading "VIP Influencer Look (Look #18)" [level=3] [ref=e517]'
              - paragraph [ref=e518]: "Pièces de cet outfit :"
              - generic [ref=e519]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e520] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e522]
                  - generic [ref=e523]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e524]
                    - generic [ref=e525]: basket pour homme
                  - generic [ref=e526]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e527] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e529]
                  - generic [ref=e530]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e531]
                    - generic [ref=e532]: basket pour homme
                  - generic [ref=e533]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e534] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e536]
                  - generic [ref=e537]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e538]
                    - generic [ref=e539]: basket pour homme
                  - generic [ref=e540]: 25,000 FCFA
            - generic [ref=e541]:
              - generic [ref=e542]:
                - generic [ref=e543]: Total du Look
                - generic [ref=e544]: 69,000 FCFA
              - button "Recréer ce look" [ref=e545] [cursor=pointer]
        - generic [ref=e549]:
          - generic [ref=e550]:
            - 'img "Clean Slate White (Look #19)" [ref=e551]'
            - generic [ref=e552]: Vioutou Outfit 🔥
          - generic [ref=e553]:
            - generic [ref=e554]:
              - 'heading "Clean Slate White (Look #19)" [level=3] [ref=e555]'
              - paragraph [ref=e556]: "Pièces de cet outfit :"
              - generic [ref=e557]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e558] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e560]
                  - generic [ref=e561]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e562]
                    - generic [ref=e563]: basket pour homme
                  - generic [ref=e564]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e565] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e567]
                  - generic [ref=e568]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e569]
                    - generic [ref=e570]: basket pour homme
                  - generic [ref=e571]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e572] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e574]
                  - generic [ref=e575]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e576]
                    - generic [ref=e577]: basket pour homme
                  - generic [ref=e578]: 22,000 FCFA
            - generic [ref=e579]:
              - generic [ref=e580]:
                - generic [ref=e581]: Total du Look
                - generic [ref=e582]: 59,500 FCFA
              - button "Recréer ce look" [ref=e583] [cursor=pointer]
        - generic [ref=e587]:
          - generic [ref=e588]:
            - 'img "Heavy Cotton Comfort (Look #20)" [ref=e589]'
            - generic [ref=e590]: Vioutou Outfit 🔥
          - generic [ref=e591]:
            - generic [ref=e592]:
              - 'heading "Heavy Cotton Comfort (Look #20)" [level=3] [ref=e593]'
              - paragraph [ref=e594]: "Pièces de cet outfit :"
              - generic [ref=e595]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e596] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e598]
                  - generic [ref=e599]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e600]
                    - generic [ref=e601]: basket pour homme
                  - generic [ref=e602]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e603] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e605]
                  - generic [ref=e606]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e607]
                    - generic [ref=e608]: basket pour homme
                  - generic [ref=e609]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e610] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e612]
                  - generic [ref=e613]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e614]
                    - generic [ref=e615]: basket pour homme
                  - generic [ref=e616]: 25,000 FCFA
            - generic [ref=e617]:
              - generic [ref=e618]:
                - generic [ref=e619]: Total du Look
                - generic [ref=e620]: 71,500 FCFA
              - button "Recréer ce look" [ref=e621] [cursor=pointer]
        - generic [ref=e625]:
          - generic [ref=e626]:
            - 'img "Dripping In Gold (Look #21)" [ref=e627]'
            - generic [ref=e628]: Vioutou Outfit 🔥
          - generic [ref=e629]:
            - generic [ref=e630]:
              - 'heading "Dripping In Gold (Look #21)" [level=3] [ref=e631]'
              - paragraph [ref=e632]: "Pièces de cet outfit :"
              - generic [ref=e633]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e634] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e636]
                  - generic [ref=e637]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e638]
                    - generic [ref=e639]: basket pour homme
                  - generic [ref=e640]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e641] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e643]
                  - generic [ref=e644]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e645]
                    - generic [ref=e646]: basket pour homme
                  - generic [ref=e647]: 24,500 FCFA
            - generic [ref=e648]:
              - generic [ref=e649]:
                - generic [ref=e650]: Total du Look
                - generic [ref=e651]: 46,500 FCFA
              - button "Recréer ce look" [ref=e652] [cursor=pointer]
        - generic [ref=e656]:
          - generic [ref=e657]:
            - 'img "Sunset Vibe Outfit (Look #22)" [ref=e658]'
            - generic [ref=e659]: Vioutou Outfit 🔥
          - generic [ref=e660]:
            - generic [ref=e661]:
              - 'heading "Sunset Vibe Outfit (Look #22)" [level=3] [ref=e662]'
              - paragraph [ref=e663]: "Pièces de cet outfit :"
              - generic [ref=e664]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e665] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e667]
                  - generic [ref=e668]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e669]
                    - generic [ref=e670]: basket pour homme
                  - generic [ref=e671]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e672] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e674]
                  - generic [ref=e675]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e676]
                    - generic [ref=e677]: basket pour homme
                  - generic [ref=e678]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e679] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e681]
                  - generic [ref=e682]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e683]
                    - generic [ref=e684]: basket pour homme
                  - generic [ref=e685]: 25,000 FCFA
            - generic [ref=e686]:
              - generic [ref=e687]:
                - generic [ref=e688]: Total du Look
                - generic [ref=e689]: 69,000 FCFA
              - button "Recréer ce look" [ref=e690] [cursor=pointer]
        - generic [ref=e694]:
          - generic [ref=e695]:
            - 'img "Gold Accented King (Look #9)" [ref=e696]'
            - generic [ref=e697]: Vioutou Outfit 🔥
          - generic [ref=e698]:
            - generic [ref=e699]:
              - 'heading "Gold Accented King (Look #9)" [level=3] [ref=e700]'
              - paragraph [ref=e701]: "Pièces de cet outfit :"
              - generic [ref=e702]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e703] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e705]
                  - generic [ref=e706]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e707]
                    - generic [ref=e708]: basket pour homme
                  - generic [ref=e709]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e710] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e712]
                  - generic [ref=e713]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e714]
                    - generic [ref=e715]: basket pour homme
                  - generic [ref=e716]: 24,500 FCFA
                - link "Jean Cargo Multi-Pockets Khaki Jean Cargo Multi-Pockets Khaki jean overside pour homme 20,500 FCFA" [ref=e717] [cursor=pointer]:
                  - /url: /produit/15
                  - img "Jean Cargo Multi-Pockets Khaki" [ref=e719]
                  - generic [ref=e720]:
                    - heading "Jean Cargo Multi-Pockets Khaki" [level=4] [ref=e721]
                    - generic [ref=e722]: jean overside pour homme
                  - generic [ref=e723]: 20,500 FCFA
            - generic [ref=e724]:
              - generic [ref=e725]:
                - generic [ref=e726]: Total du Look
                - generic [ref=e727]: 67,000 FCFA
              - button "Recréer ce look" [ref=e728] [cursor=pointer]
        - generic [ref=e732]:
          - generic [ref=e733]:
            - 'img "Modern Safari (Look #15)" [ref=e734]'
            - generic [ref=e735]: Vioutou Outfit 🔥
          - generic [ref=e736]:
            - generic [ref=e737]:
              - 'heading "Modern Safari (Look #15)" [level=3] [ref=e738]'
              - paragraph [ref=e739]: "Pièces de cet outfit :"
              - generic [ref=e740]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e741] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e743]
                  - generic [ref=e744]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e745]
                    - generic [ref=e746]: basket pour homme
                  - generic [ref=e747]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e748] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e750]
                  - generic [ref=e751]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e752]
                    - generic [ref=e753]: basket pour homme
                  - generic [ref=e754]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e755] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e757]
                  - generic [ref=e758]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e759]
                    - generic [ref=e760]: basket pour homme
                  - generic [ref=e761]: 22,000 FCFA
            - generic [ref=e762]:
              - generic [ref=e763]:
                - generic [ref=e764]: Total du Look
                - generic [ref=e765]: 59,500 FCFA
              - button "Recréer ce look" [ref=e766] [cursor=pointer]
        - generic [ref=e770]:
          - generic [ref=e771]:
            - 'img "Dapper Street Boy (Look #16)" [ref=e772]'
            - generic [ref=e773]: Vioutou Outfit 🔥
          - generic [ref=e774]:
            - generic [ref=e775]:
              - 'heading "Dapper Street Boy (Look #16)" [level=3] [ref=e776]'
              - paragraph [ref=e777]: "Pièces de cet outfit :"
              - generic [ref=e778]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e779] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e781]
                  - generic [ref=e782]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e783]
                    - generic [ref=e784]: basket pour homme
                  - generic [ref=e785]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e786] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e788]
                  - generic [ref=e789]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e790]
                    - generic [ref=e791]: basket pour homme
                  - generic [ref=e792]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e793] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e795]
                  - generic [ref=e796]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e797]
                    - generic [ref=e798]: basket pour homme
                  - generic [ref=e799]: 25,000 FCFA
            - generic [ref=e800]:
              - generic [ref=e801]:
                - generic [ref=e802]: Total du Look
                - generic [ref=e803]: 71,500 FCFA
              - button "Recréer ce look" [ref=e804] [cursor=pointer]
        - generic [ref=e808]:
          - generic [ref=e809]:
            - 'img "Classic HP Drip (Look #10)" [ref=e810]'
            - generic [ref=e811]: Vioutou Outfit 🔥
          - generic [ref=e812]:
            - generic [ref=e813]:
              - 'heading "Classic HP Drip (Look #10)" [level=3] [ref=e814]'
              - paragraph [ref=e815]: "Pièces de cet outfit :"
              - generic [ref=e816]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e817] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e819]
                  - generic [ref=e820]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e821]
                    - generic [ref=e822]: basket pour homme
                  - generic [ref=e823]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e824] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e826]
                  - generic [ref=e827]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e828]
                    - generic [ref=e829]: basket pour homme
                  - generic [ref=e830]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e831] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e833]
                  - generic [ref=e834]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e835]
                    - generic [ref=e836]: basket pour homme
                  - generic [ref=e837]: 25,000 FCFA
            - generic [ref=e838]:
              - generic [ref=e839]:
                - generic [ref=e840]: Total du Look
                - generic [ref=e841]: 69,000 FCFA
              - button "Recréer ce look" [ref=e842] [cursor=pointer]
        - generic [ref=e846]:
          - generic [ref=e847]:
            - 'img "Urban Royalty (Look #1)" [ref=e848]'
            - generic [ref=e849]: Vioutou Outfit 🔥
          - generic [ref=e850]:
            - generic [ref=e851]:
              - 'heading "Urban Royalty (Look #1)" [level=3] [ref=e852]'
              - paragraph [ref=e853]: "Pièces de cet outfit :"
              - generic [ref=e854]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e855] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e857]
                  - generic [ref=e858]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e859]
                    - generic [ref=e860]: basket pour homme
                  - generic [ref=e861]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e862] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e864]
                  - generic [ref=e865]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e866]
                    - generic [ref=e867]: basket pour homme
                  - generic [ref=e868]: 24,500 FCFA
            - generic [ref=e869]:
              - generic [ref=e870]:
                - generic [ref=e871]: Total du Look
                - generic [ref=e872]: 46,500 FCFA
              - button "Recréer ce look" [ref=e873] [cursor=pointer]
        - generic [ref=e877]:
          - generic [ref=e878]:
            - 'img "Denim Deluxe (Look #2)" [ref=e879]'
            - generic [ref=e880]: Vioutou Outfit 🔥
          - generic [ref=e881]:
            - generic [ref=e882]:
              - 'heading "Denim Deluxe (Look #2)" [level=3] [ref=e883]'
              - paragraph [ref=e884]: "Pièces de cet outfit :"
              - generic [ref=e885]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e886] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e888]
                  - generic [ref=e889]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e890]
                    - generic [ref=e891]: basket pour homme
                  - generic [ref=e892]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e893] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e895]
                  - generic [ref=e896]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e897]
                    - generic [ref=e898]: basket pour homme
                  - generic [ref=e899]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e900] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e902]
                  - generic [ref=e903]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e904]
                    - generic [ref=e905]: basket pour homme
                  - generic [ref=e906]: 25,000 FCFA
            - generic [ref=e907]:
              - generic [ref=e908]:
                - generic [ref=e909]: Total du Look
                - generic [ref=e910]: 69,000 FCFA
              - button "Recréer ce look" [ref=e911] [cursor=pointer]
        - generic [ref=e915]:
          - generic [ref=e916]:
            - 'img "Luxe Streetwear (Look #3)" [ref=e917]'
            - generic [ref=e918]: Vioutou Outfit 🔥
          - generic [ref=e919]:
            - generic [ref=e920]:
              - 'heading "Luxe Streetwear (Look #3)" [level=3] [ref=e921]'
              - paragraph [ref=e922]: "Pièces de cet outfit :"
              - generic [ref=e923]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e924] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e926]
                  - generic [ref=e927]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e928]
                    - generic [ref=e929]: basket pour homme
                  - generic [ref=e930]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e931] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e933]
                  - generic [ref=e934]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e935]
                    - generic [ref=e936]: basket pour homme
                  - generic [ref=e937]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e938] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e940]
                  - generic [ref=e941]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e942]
                    - generic [ref=e943]: basket pour homme
                  - generic [ref=e944]: 22,000 FCFA
            - generic [ref=e945]:
              - generic [ref=e946]:
                - generic [ref=e947]: Total du Look
                - generic [ref=e948]: 59,500 FCFA
              - button "Recréer ce look" [ref=e949] [cursor=pointer]
        - generic [ref=e953]:
          - generic [ref=e954]:
            - 'img "Minimalist Vibe (Look #4)" [ref=e955]'
            - generic [ref=e956]: Vioutou Outfit 🔥
          - generic [ref=e957]:
            - generic [ref=e958]:
              - 'heading "Minimalist Vibe (Look #4)" [level=3] [ref=e959]'
              - paragraph [ref=e960]: "Pièces de cet outfit :"
              - generic [ref=e961]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e962] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e964]
                  - generic [ref=e965]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e966]
                    - generic [ref=e967]: basket pour homme
                  - generic [ref=e968]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e969] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e971]
                  - generic [ref=e972]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e973]
                    - generic [ref=e974]: basket pour homme
                  - generic [ref=e975]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e976] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e978]
                  - generic [ref=e979]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e980]
                    - generic [ref=e981]: basket pour homme
                  - generic [ref=e982]: 25,000 FCFA
            - generic [ref=e983]:
              - generic [ref=e984]:
                - generic [ref=e985]: Total du Look
                - generic [ref=e986]: 71,500 FCFA
              - button "Recréer ce look" [ref=e987] [cursor=pointer]
        - generic [ref=e991]:
          - generic [ref=e992]:
            - 'img "Margiela Flow (Look #5)" [ref=e993]'
            - generic [ref=e994]: Vioutou Outfit 🔥
          - generic [ref=e995]:
            - generic [ref=e996]:
              - 'heading "Margiela Flow (Look #5)" [level=3] [ref=e997]'
              - paragraph [ref=e998]: "Pièces de cet outfit :"
              - generic [ref=e999]:
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e1000] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e1002]
                  - generic [ref=e1003]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e1004]
                    - generic [ref=e1005]: basket pour homme
                  - generic [ref=e1006]: 22,000 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e1007] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e1009]
                  - generic [ref=e1010]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e1011]
                    - generic [ref=e1012]: basket pour homme
                  - generic [ref=e1013]: 24,500 FCFA
            - generic [ref=e1014]:
              - generic [ref=e1015]:
                - generic [ref=e1016]: Total du Look
                - generic [ref=e1017]: 46,500 FCFA
              - button "Recréer ce look" [ref=e1018] [cursor=pointer]
        - generic [ref=e1022]:
          - generic [ref=e1023]:
            - 'img "Cozy Street Wear (Look #6)" [ref=e1024]'
            - generic [ref=e1025]: Vioutou Outfit 🔥
          - generic [ref=e1026]:
            - generic [ref=e1027]:
              - 'heading "Cozy Street Wear (Look #6)" [level=3] [ref=e1028]'
              - paragraph [ref=e1029]: "Pièces de cet outfit :"
              - generic [ref=e1030]:
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e1031] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e1033]
                  - generic [ref=e1034]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e1035]
                    - generic [ref=e1036]: basket pour homme
                  - generic [ref=e1037]: 19,500 FCFA
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e1038] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e1040]
                  - generic [ref=e1041]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e1042]
                    - generic [ref=e1043]: basket pour homme
                  - generic [ref=e1044]: 24,500 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e1045] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e1047]
                  - generic [ref=e1048]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e1049]
                    - generic [ref=e1050]: basket pour homme
                  - generic [ref=e1051]: 25,000 FCFA
            - generic [ref=e1052]:
              - generic [ref=e1053]:
                - generic [ref=e1054]: Total du Look
                - generic [ref=e1055]: 69,000 FCFA
              - button "Recréer ce look" [ref=e1056] [cursor=pointer]
        - generic [ref=e1060]:
          - generic [ref=e1061]:
            - 'img "Sport Runner Elite (Look #7)" [ref=e1062]'
            - generic [ref=e1063]: Vioutou Outfit 🔥
          - generic [ref=e1064]:
            - generic [ref=e1065]:
              - 'heading "Sport Runner Elite (Look #7)" [level=3] [ref=e1066]'
              - paragraph [ref=e1067]: "Pièces de cet outfit :"
              - generic [ref=e1068]:
                - link "Retro Trainer Multi-Color Retro Trainer Multi-Color basket pour homme 18,000 FCFA" [ref=e1069] [cursor=pointer]:
                  - /url: /produit/5
                  - img "Retro Trainer Multi-Color" [ref=e1071]
                  - generic [ref=e1072]:
                    - heading "Retro Trainer Multi-Color" [level=4] [ref=e1073]
                    - generic [ref=e1074]: basket pour homme
                  - generic [ref=e1075]: 18,000 FCFA
                - link "Runner Sport Premium White Runner Sport Premium White basket pour homme 19,500 FCFA" [ref=e1076] [cursor=pointer]:
                  - /url: /produit/3
                  - img "Runner Sport Premium White" [ref=e1078]
                  - generic [ref=e1079]:
                    - heading "Runner Sport Premium White" [level=4] [ref=e1080]
                    - generic [ref=e1081]: basket pour homme
                  - generic [ref=e1082]: 19,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e1083] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e1085]
                  - generic [ref=e1086]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e1087]
                    - generic [ref=e1088]: basket pour homme
                  - generic [ref=e1089]: 22,000 FCFA
            - generic [ref=e1090]:
              - generic [ref=e1091]:
                - generic [ref=e1092]: Total du Look
                - generic [ref=e1093]: 59,500 FCFA
              - button "Recréer ce look" [ref=e1094] [cursor=pointer]
        - generic [ref=e1098]:
          - generic [ref=e1099]:
            - 'img "Oversized Monogram (Look #12)" [ref=e1100]'
            - generic [ref=e1101]: Vioutou Outfit 🔥
          - generic [ref=e1102]:
            - generic [ref=e1103]:
              - 'heading "Oversized Monogram (Look #12)" [level=3] [ref=e1104]'
              - paragraph [ref=e1105]: "Pièces de cet outfit :"
              - generic [ref=e1106]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e1107] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e1109]
                  - generic [ref=e1110]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e1111]
                    - generic [ref=e1112]: basket pour homme
                  - generic [ref=e1113]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e1114] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e1116]
                  - generic [ref=e1117]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e1118]
                    - generic [ref=e1119]: basket pour homme
                  - generic [ref=e1120]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e1121] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e1123]
                  - generic [ref=e1124]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e1125]
                    - generic [ref=e1126]: basket pour homme
                  - generic [ref=e1127]: 25,000 FCFA
            - generic [ref=e1128]:
              - generic [ref=e1129]:
                - generic [ref=e1130]: Total du Look
                - generic [ref=e1131]: 71,500 FCFA
              - button "Recréer ce look" [ref=e1132] [cursor=pointer]
        - generic [ref=e1136]:
          - generic [ref=e1137]:
            - 'img "Benin Trendsetter (Look #8)" [ref=e1138]'
            - generic [ref=e1139]: Vioutou Outfit 🔥
          - generic [ref=e1140]:
            - generic [ref=e1141]:
              - 'heading "Benin Trendsetter (Look #8)" [level=3] [ref=e1142]'
              - paragraph [ref=e1143]: "Pièces de cet outfit :"
              - generic [ref=e1144]:
                - link "Basket Urban Luxe Gold Basket Urban Luxe Gold basket pour homme 24,500 FCFA" [ref=e1145] [cursor=pointer]:
                  - /url: /produit/2
                  - img "Basket Urban Luxe Gold" [ref=e1147]
                  - generic [ref=e1148]:
                    - heading "Basket Urban Luxe Gold" [level=4] [ref=e1149]
                    - generic [ref=e1150]: basket pour homme
                  - generic [ref=e1151]: 24,500 FCFA
                - link "Basket Streetwear Classic Black & White Basket Streetwear Classic Black & White basket pour homme 22,000 FCFA" [ref=e1152] [cursor=pointer]:
                  - /url: /produit/1
                  - img "Basket Streetwear Classic Black & White" [ref=e1154]
                  - generic [ref=e1155]:
                    - heading "Basket Streetwear Classic Black & White" [level=4] [ref=e1156]
                    - generic [ref=e1157]: basket pour homme
                  - generic [ref=e1158]: 22,000 FCFA
                - link "Sneaker High Top Noir Intense Sneaker High Top Noir Intense basket pour homme 25,000 FCFA" [ref=e1159] [cursor=pointer]:
                  - /url: /produit/4
                  - img "Sneaker High Top Noir Intense" [ref=e1161]
                  - generic [ref=e1162]:
                    - heading "Sneaker High Top Noir Intense" [level=4] [ref=e1163]
                    - generic [ref=e1164]: basket pour homme
                  - generic [ref=e1165]: 25,000 FCFA
            - generic [ref=e1166]:
              - generic [ref=e1167]:
                - generic [ref=e1168]: Total du Look
                - generic [ref=e1169]: 71,500 FCFA
              - button "Recréer ce look" [ref=e1170] [cursor=pointer]
    - generic [ref=e1174]:
      - generic [ref=e1175]:
        - generic [ref=e1176]:
          - link [ref=e1177] [cursor=pointer]:
            - /url: /
            - img "HP Collection Logo" [ref=e1178]
          - paragraph [ref=e1179]: Vioutou t'habille. Tu règnes.
          - paragraph [ref=e1180]: La marque de mode streetwear premium au Bénin. Statut, style, modernité et une élégance sans compromis.
        - generic [ref=e1181]:
          - heading "Catégories" [level=3] [ref=e1182]
          - list [ref=e1183]:
            - listitem [ref=e1184]:
              - link "Baskets pour Homme" [ref=e1185] [cursor=pointer]:
                - /url: /categorie/basket-pour-homme
            - listitem [ref=e1186]:
              - link "Complets Streetwear" [ref=e1187] [cursor=pointer]:
                - /url: /categorie/complet-pour-homme
            - listitem [ref=e1188]:
              - link "Jeans Oversize" [ref=e1189] [cursor=pointer]:
                - /url: /categorie/jean-overside-pour-homme
            - listitem [ref=e1190]:
              - link "Claquettes & Sandales" [ref=e1191] [cursor=pointer]:
                - /url: /categorie/tapettes-pour-homme
        - generic [ref=e1192]:
          - heading "Découvrir" [level=3] [ref=e1193]
          - list [ref=e1194]:
            - listitem [ref=e1195]:
              - link "Looks de Vioutou" [ref=e1196] [cursor=pointer]:
                - /url: /looks
            - listitem [ref=e1197]:
              - link "Avis Clients" [ref=e1198] [cursor=pointer]:
                - /url: /#testimonials
            - listitem [ref=e1199]:
              - link "Foire Aux Questions" [ref=e1200] [cursor=pointer]:
                - /url: /#faq
        - generic [ref=e1201]:
          - heading "Boutique" [level=3] [ref=e1202]
          - paragraph [ref=e1203]:
            - generic [ref=e1204]: Bénin
            - generic [ref=e1211]: Livraison 24h/48h dans tout le pays.
            - generic [ref=e1215]: 💬 Commandes instantanées via WhatsApp.
          - link "Discuter sur WhatsApp" [ref=e1216] [cursor=pointer]:
            - /url: https://wa.me/22967280018
      - generic [ref=e1217]:
        - paragraph [ref=e1218]: © 2026 HP Collection. Tous droits réservés.
        - paragraph [ref=e1219]: Créé pour Vioutou | Mode Streetwear Premium Bénin 🇧🇯
    - link "Deal avec Vioutou" [ref=e1220] [cursor=pointer]:
      - /url: https://wa.me/22967280018?text=Bonjour%20Vioutou%20!%20Je%20viens%20du%20site%20HP%20Collection%20et%20j'aimerais%20discuter%20de%20vos%20outfits.
  - alert [ref=e1223]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // Phase finale 09/2026 (E1) — HP inspection, parcours RÉELS :
  4   | // /looks = cartes inline (pièces listées + liens) ; home = carrousel -> LookModal.
  5   | // Données du build sans env : looks statiques AVEC pièces reliées (ex. Look #1
  6   | // -> produit 6) ; l'état « sans pièces » est couvert par les gardes unitaires.
  7   | 
  8   | test.describe('E1 — HP inspection (page /looks)', () => {
  9   |   test('une carte HP liste ses pièces avec liens vers les fiches produit', async ({ page }) => {
  10  |     await page.goto('/looks');
  11  |     const piece = page.locator('a[href^="/produit/"]').first();
  12  |     await expect(piece).toBeVisible({ timeout: 20000 });
  13  |     await expect(page.getByText('Pièces de cet outfit :').first()).toBeVisible();
  14  |   });
  15  | 
  16  |   test('clic sur une pièce -> la fiche produit s’ouvre (inspection réelle)', async ({ page }) => {
  17  |     await page.goto('/looks');
  18  |     const piece = page.locator('a[href^="/produit/"]').first();
  19  |     await piece.waitFor({ state: 'visible', timeout: 20000 });
  20  |     await piece.click();
> 21  |     await page.waitForURL(/\/produit\//, { timeout: 15000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  22  |     expect(page.url()).toContain('/produit/');
  23  |   });
  24  | 
  25  |   test('chaque carte garde une issue WhatsApp (« Recréer ce look »)', async ({ page }) => {
  26  |     await page.goto('/looks');
  27  |     const recreer = page.getByRole('button', { name: /Recréer ce look/i }).first();
  28  |     await expect(recreer).toBeVisible({ timeout: 20000 });
  29  |   });
  30  | });
  31  | 
  32  | test.describe('E1 — HP inspection (carrousel home -> LookModal)', () => {
  33  |   test('clic souris sur un HP du carrousel ouvre la modale d’inspection', async ({ page }) => {
  34  |     await page.goto('/');
  35  |     // viser directement la section carrousel (les vignettes d'intro portent
  36  |     // des alts « Look #N » identiques mais ne sont pas cliquables)
  37  |     const section = page.locator('#carousel-outfits');
  38  |     await section.waitFor({ state: 'attached', timeout: 20000 });
  39  |     await section.scrollIntoViewIfNeeded();
  40  |     await page.waitForTimeout(1200);
  41  |     // Cibler une carte dont le centre est DANS le viewport : en production,
  42  |     // l'hydratation est immédiate et l'auto-scroll (80 px/s) déplace déjà la
  43  |     // première carte hors écran pendant les délais d'attente — cliquer son
  44  |     // centre historique partirait à côté du viewport (clic dans le vide).
  45  |     const cartes = section.locator('img[alt*="Look #"]');
  46  |     const nbCartes = await cartes.count();
  47  |     const vw = page.viewportSize()?.width ?? 1280;
  48  |     const vh = page.viewportSize()?.height ?? 900;
  49  |     let box0: { x: number; y: number; width: number; height: number } | null = null;
  50  |     for (let i = 0; i < nbCartes; i += 1) {
  51  |       const bx = await cartes.nth(i).boundingBox().catch(() => null);
  52  |       if (bx && bx.x + bx.width / 2 >= 24 && bx.x + bx.width / 2 <= vw - 24 && bx.y + bx.height / 2 >= 24 && bx.y + bx.height / 2 <= vh - 24) {
  53  |         box0 = bx;
  54  |         break;
  55  |       }
  56  |     }
  57  |     if (!box0) throw new Error('aucune carte cliquable dans le viewport');
  58  |     // le survol met l'auto-scroll en pause (onMouseEnter du track) : la piste
  59  |     // devient alors stable. NB: locator.hover() vérifie la stabilité AVANT de
  60  |     // bouger la souris (impasse) — déplacement manuel comme un visiteur.
  61  |     // C'est précisément le parcours que la capture de pointeur au pointerdown
  62  |     // rendait impossible avant le correctif E1.
  63  |     await page.mouse.move(box0.x + box0.width / 2, box0.y + box0.height / 2);
  64  |     await page.waitForTimeout(1000);
  65  |     // clic 100 % souris au centre recalculé après pause de l'auto-scroll :
  66  |     // mousedown/pointerdown réels sur la carte, comme un visiteur.
  67  |     const apresPause = await page.evaluate(([cx, cy]) => { const el = document.elementFromPoint(cx, cy); return el ? el.getAttribute('alt') || el.tagName : null; }, [box0.x + box0.width / 2, box0.y + box0.height / 2]);
  68  |     if (!apresPause || !String(apresPause).includes('Look #')) {
  69  |       // la carte a dérivé avant la pause : on recentre une fois sur l'élément
  70  |       // réellement présent sous le curseur (la piste est en pause depuis le hover).
  71  |       const sousCurseur = await page.evaluate(() => {
  72  |         const imgs = Array.from(document.querySelectorAll('#carousel-outfits img'));
  73  |         for (const img of imgs) {
  74  |           const r = img.getBoundingClientRect();
  75  |           if (r.x + r.width / 2 >= 24 && r.x + r.width / 2 <= window.innerWidth - 24) return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  76  |         }
  77  |         return null;
  78  |       });
  79  |       if (sousCurseur) await page.mouse.move(sousCurseur.x, sousCurseur.y);
  80  |       await page.waitForTimeout(400);
  81  |     }
  82  |     const finale = await page.evaluate(() => {
  83  |       const imgs = Array.from(document.querySelectorAll('#carousel-outfits img'));
  84  |       for (const img of imgs) {
  85  |         const r = img.getBoundingClientRect();
  86  |         if (r.x + r.width / 2 >= 24 && r.x + r.width / 2 <= window.innerWidth - 24 && r.y + r.height / 2 >= 24 && r.y + r.height / 2 <= window.innerHeight - 24) {
  87  |           return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  88  |         }
  89  |       }
  90  |       return null;
  91  |     });
  92  |     if (!finale) throw new Error('aucune carte cliquable après pause');
  93  |     await page.mouse.click(finale.x, finale.y);
  94  |     const dialog = page.locator('[role="dialog"]').first();
  95  |     await expect(dialog).toBeVisible({ timeout: 10000 });
  96  |     // LookModal : « Cet outfit est composé de pièces… » (pièces reliées) ou
  97  |     // « Les pièces de ce look ne sont pas encore reliées… » (état vide E1).
  98  |     await expect(dialog).toContainText(/pièces/i);
  99  |     // inspection réelle : les pièces ouvrent leur fiche produit.
  100 |     await expect(dialog.locator('a[href^="/produit/"]').first()).toBeVisible();
  101 |   });
  102 | });
  103 | 
  104 | test.describe('E1 — drag-to-scroll préservé (non-régression capture)', () => {
  105 |   test('un drag horizontal fait défiler la piste sans ouvrir la modale', async ({ page }) => {
  106 |     await page.goto('/');
  107 |     const section = page.locator('#carousel-outfits');
  108 |     await section.waitFor({ state: 'attached', timeout: 20000 });
  109 |     await section.scrollIntoViewIfNeeded();
  110 |     await page.waitForTimeout(1200);
  111 |     const carte = section.locator('img[alt*="Look #"]').first();
  112 |     await carte.waitFor({ state: 'visible', timeout: 20000 });
  113 |     const box = await carte.boundingBox();
  114 |     if (!box) throw new Error('carte hors viewport');
  115 |     const track = section.locator('.outfit-carousel-track');
  116 |     const before = await track.evaluate((el) => el.scrollLeft);
  117 |     const cx = box.x + box.width / 2;
  118 |     const cy = box.y + box.height / 2;
  119 |     await page.mouse.move(cx, cy);
  120 |     await page.waitForTimeout(300);
  121 |     await page.mouse.down();
```