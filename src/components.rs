//use html5ever::tree_builder::TreeSink;
use nipper::{Document, Selection};
pub fn five() -> f64 {
    5.3
}

struct Component {
    name: &'static str,
    process: fn(Selection) -> Document,
}

const COMPONENTS: [Component; 1] = [Component {
    name: "xy-plot",
    process: (|mut e| Document::from(r#"<div>PLOT GOES HERE</div>"#)),
}];

/*<div id="myDiv"></div>
<script type="text/rainy-loop-js">
  var trace1 = {
    x: globalRainyContext.xs,
    y: globalRainyContext.ys,
    type: 'scatter'
  };
  Plotly.newPlot('myDiv', [trace1]);
</script> */

pub fn process_components(html: &str) -> String {
    let mut fragment = Document::from(html);
    //process_components_html(&mut fragment);

    for Component { name, process } in COMPONENTS {
        let selection = fragment.select(name);

        //dbg!(fragment.select(&selector));

        for mut element in selection.iter() {
            let h_substitute = process(element);
            element.replace_with_selection(&h_substitute.select("*"))
            //dbg!(element.value());
        }
    }

    fragment.html().to_string()
}

/*fn process_component(Component { name, process }: Component, doc: Document) -> Document {
    let mut mdoc = Document::from(doc.html());
    let selection = mdoc.select(name);

    for mut element in selection.iter() {
        let h_substitute = process(element);
        //element.replace_with_selection(&h_substitute.select("*"))
        //dbg!(element.value());
    }
    mdoc
}*/

/*fn process_components_html(fragment: &mut Html) {
    for Component { name, process } in COMPONENTS {
        let selector = scraper::Selector::parse(name).unwrap();

        //dbg!(fragment.select(&selector));
        for element in fragment.select(&selector) {
            let id = element.id()
            let h_substitute = process(element);
            fragment.remove_from_parent(&id);
            dbg!(element.value());
        }
    }
}*/
